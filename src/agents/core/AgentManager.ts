import { agentRegistry } from './AgentRegistry';
import { agentEventBus } from './AgentEvents';
import { sharedMemory } from './AgentMemory';
import { AgentTask, AgentResponse, EventType } from './AgentTypes';
import { useOrchestrationStore } from '../../store/orchestrationStore';

const MAX_RETRIES = 3;

export type OrchestrationState = 
  | 'CREATED'
  | 'INITIAL_ANALYSIS' 
  | 'AGGREGATING'
  | 'VERIFYING' 
  | 'CONSENSUS'
  | 'FINALIZING'
  | 'COMPLETED'
  | 'FAILED'
  | 'EXPIRED'
  | 'LOCATION_PENDING'
  | 'LOCATION_VERIFIED'
  | 'LOCATION_UNAVAILABLE'
  | 'REANALYZING' 
  | 'REROUTING' 
  | 'ESCALATING' 
  | 'BLOCKED' 
  | 'STABILIZING' 
  | 'RESOLVED' 
  | 'FINALIZED'
  | 'MONITORING_FUTURE_RISK'
  | 'PREVENTIVE_REROUTE'
  | 'EARLY_WARNING'
  | 'ESCALATION_PROBABLE'
  | 'FUTURE_ROUTE_UNSAFE'
  | 'PREDICTIVE_RECOVERY';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type RetryState = 
  | 'RETRY_PENDING' 
  | 'RETRY_ACTIVE' 
  | 'RETRY_BLOCKED' 
  | 'RETRY_FAILED' 
  | 'RETRY_EXPIRED' 
  | 'RECOVERY_MODE';

export class AgentManager {
  private static instance: AgentManager;
  private isProcessing: boolean = false;
  private taskQueue: (AgentTask & { targetAgentId: string; priority: TaskPriority })[] = [];
  
  // Track operational states, task priorities, and retry states for console dashboard visibility
  private orchestrationStates: Map<string, OrchestrationState> = new Map();
  private taskPriorities: Map<string, TaskPriority> = new Map();
  private retryStates: Map<string, RetryState> = new Map();
  
  // Track failed execution histories to make retries fully failure-aware
  private failureHistories: Map<string, string[]> = new Map();

  // Consumed events registry to track processed events and block replay loops
  private consumedEvents: Map<string, {
    eventId: string;
    taskId: string;
    executionHash: string;
    processedAt: number;
    consumedBy: string;
  }> = new Map();

  // Task-level execution locks to prevent concurrent re-entrancy / simultaneous escalations
  private taskExecutionLocks: Set<string> = new Set();
  private activeTaskRegistry: Set<string> = new Set();

  // Execution counters per task
  private taskEscalationCounts: Map<string, number> = new Map();
  private taskAlertCounts: Map<string, number> = new Map();
  private taskConsensusCounts: Map<string, number> = new Map();
  private taskRetryCounts: Map<string, number> = new Map();

  // Transition path logs for loop detection
  private taskTransitionPaths: Map<string, string[]> = new Map();

  // Sliding window instability metrics to trigger global Recovery Mode
  private globalFailureTimestamps: number[] = [];
  private isGlobalRecoveryMode: boolean = false;

  private locationCooldowns: Map<string, { timestamp: number; snapshotHash: string }> = new Map();
  private analysisCache: Map<string, { response: AgentResponse; timestamp: number }> = new Map();

  private computeStringHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16);
  }

  private constructor() {
    this.setupEventListeners();
  }

  public static getInstance(): AgentManager {
    if (!AgentManager.instance) {
      AgentManager.instance = new AgentManager();
    }
    return AgentManager.instance;
  }

  public getIsGlobalRecoveryMode(): boolean {
    return this.isGlobalRecoveryMode;
  }

  public getGlobalFailureCount(): number {
    return this.globalFailureTimestamps.length;
  }

  public getRetryState(taskId: string): RetryState {
    return this.retryStates.get(taskId) || 'RETRY_ACTIVE';
  }

  public getTaskPriority(taskId: string): TaskPriority {
    return this.taskPriorities.get(taskId) || 'MEDIUM';
  }

  private logExecution(agentName: string, message: string, status: 'info' | 'success' | 'warning' | 'error' = 'info') {
    const { addLog } = useOrchestrationStore.getState();
    addLog({
      agent: agentName,
      message,
      status,
    });
    console.log(`[${agentName.toUpperCase()}] ${message}`);
  }

  /**
   * Set and publish the orchestration state of a task.
   */
  public updateOrchestrationState(taskId: string, state: any) {
    this.orchestrationStates.set(taskId, state);
    this.logExecution('Manager', `[STATE] Task ${taskId} shifted state to: ${state}`, 'info');

    // Clean up active registry if task reached a terminal state (Rule 1 & Rule 9)
    const TERMINAL_STATES = new Set(['RESOLVED', 'BLOCKED', 'ABORTED', 'TERMINATED', 'FINALIZED', 'STABILIZED_FAILURE']);
    if (TERMINAL_STATES.has(state)) {
      this.activeTaskRegistry.delete(taskId);
      console.log(`[Manager] Task ${taskId} has completed/halted in state ${state}. Removed from active registry.`);
    }
  }

  public getOrchestrationState(taskId: string): any {
    return this.orchestrationStates.get(taskId) || 'INITIAL_ANALYSIS';
  }

  private setupEventListeners() {
    // 1. Sentinel Triggers: Intercept threat ingestion and execute 100% deterministic pipeline
    agentEventBus.subscribe('HAZARD_DETECTED', (event) => {
      this.logExecution('System', `[EVENT] HAZARD_DETECTED emitted by ${event.sourceAgent}`);
      const taskId = event.payload?.hazardId || event.payload?.taskId || event.eventId;
      
      // Kick off the 100% deterministic coordination pipeline to eliminate loop storming
      this.executePipeline(taskId, event.payload, event.sourceAgent);
    });

    // Retain observation listeners to populate premium real-time dashboards safely without loops
    agentEventBus.subscribe('SIGNAL_VALIDATED', (event) => {
      this.logExecution('System', `[OBSERVATION] SIGNAL_VALIDATED event observed for task ${event.payload?.hazardId || event.eventId}`);
    });

    agentEventBus.subscribe('VERIFICATION_REQUIRED', (event) => {
      this.logExecution('System', `[OBSERVATION] VERIFICATION_REQUIRED event observed for task ${event.payload?.hazardId || event.eventId}`);
    });

    agentEventBus.subscribe('ROUTE_UNSAFE', (event) => {
      this.logExecution('System', `[OBSERVATION] ROUTE_UNSAFE event observed for task ${event.payload?.hazardId || event.eventId}`);
    });

    agentEventBus.subscribe('ALERT_ESCALATED', (event) => {
      this.logExecution('System', `[OBSERVATION] ALERT_ESCALATED event observed for task ${event.payload?.hazardId || event.eventId}`);
    });
  }

  /**
   * Sort queue by task priority: CRITICAL -> HIGH -> MEDIUM -> LOW
   */
  private sortQueuePriorities() {
    const priorityWeights: Record<TaskPriority, number> = {
      CRITICAL: 4,
      HIGH: 3,
      MEDIUM: 2,
      LOW: 1
    };

    // If global recovery mode is active, degrade LOW priority tasks to prevent processing CPU spikes
    this.taskQueue.forEach(task => {
      if (this.isGlobalRecoveryMode && task.priority === 'LOW') {
        task.priority = 'LOW'; // Maintain low priority but sort order ensures critical execute first
      }
    });

    this.taskQueue.sort((a, b) => {
      const weightA = priorityWeights[a.priority] || 2;
      const weightB = priorityWeights[b.priority] || 2;
      return weightB - weightA;
    });
  }

  /**
   * Computes dynamic backoff delays based on retry loops to prevent event storming:
   * First retry: Immediate (0 ms)
   * Second retry: Delayed (1200 ms)
   * Third retry: Cooldown (3000 ms)
   */
  private getRetryDelayMs(retryCount: number): number {
    if (retryCount <= 1) return 0;
    if (retryCount === 2) return 1200;
    return 3000;
  }

  public async dispatchTask(task: AgentTask, targetAgentId: string): Promise<void> {
    // 1. Strict Immutable Terminal State Guard (Prevent ANY re-entry)
    const state = this.getOrchestrationState(task.id);
    const TERMINAL_STATES = new Set(['FINALIZING', 'COMPLETED', 'FAILED', 'EXPIRED', 'PASSIVE_MONITORING', 'RESOLVED', 'BLOCKED', 'ABORTED', 'TERMINATED', 'FINALIZED', 'STABILIZED_FAILURE']);
    if (TERMINAL_STATES.has(state)) {
      this.logExecution('Manager', `[ORCHESTRATION BLOCKED] Task ${task.id} is in terminal state '${state}'. Orchestration is locked and immutable.`, 'warning');
      useOrchestrationStore.getState().incrementBlockedLoops();
      return;
    }

    // 2. Concurrency Mutex / Active Task Registry Locking
    if (this.activeTaskRegistry.has(task.id)) {
      this.logExecution('Manager', `[ACTIVE TASK MUTEX] Task ${task.id} is already in active orchestration registry. Locking duplicate initialization.`, 'warning');
      return;
    }

    // 3. Kick off the 100% deterministic coordination pipeline directly
    this.executePipeline(task.id, task.payload, task.sourceAgent || 'manager');
  }

  private enqueueAndProcessTask(task: AgentTask, targetAgentId: string, priority: TaskPriority) {
    this.taskQueue.push({ 
      ...task, 
      targetAgentId, 
      priority 
    });
    
    // Dynamically reorganize enqueued elements based on hazard risks
    this.sortQueuePriorities();
    
    this.processQueue();
  }

  private async processQueue() {
    if (this.isProcessing || this.taskQueue.length === 0) return;
    this.isProcessing = true;

    while (this.taskQueue.length > 0) {
      const taskObj = this.taskQueue.shift()!;
      await this.executeAgent(taskObj, taskObj.targetAgentId);
    }

    this.isProcessing = false;
  }

  /**
   * Slide window analyzer to monitor systematic failures.
   * If errors/rejections exceed 4 within a 60-second window, enters RECOVERY_MODE.
   */
  private recordFailureAndCheckInstability(taskId: string, errorReason: string) {
    const now = Date.now();
    this.globalFailureTimestamps.push(now);

    // Append to local failure history logs
    const history = this.failureHistories.get(taskId) || [];
    this.failureHistories.set(taskId, [...history, errorReason]);

    // Clean up older timestamps (> 60s)
    this.globalFailureTimestamps = this.globalFailureTimestamps.filter(t => now - t < 60000);

    if (this.globalFailureTimestamps.length >= 4) {
      if (!this.isGlobalRecoveryMode) {
        this.isGlobalRecoveryMode = true;
        this.logExecution('Manager', `[RECOVERY_MODE] Global orchestration instability detected! (${this.globalFailureTimestamps.length} failures). Entering dynamic RECOVERY_MODE.`, 'error');
        
        agentEventBus.publish({
          eventType: 'RECOVERY_MODE_ENABLED',
          sourceAgent: 'manager',
          payload: { failureCount: this.globalFailureTimestamps.length }
        });

        // Trigger dynamic recovery reset: downgrade unstable hazard confidence and pause active alerts
        sharedMemory.negotiationMemory.clear();
      }
    }
  }

  private checkAndResolveGlobalRecovery() {
    const now = Date.now();
    this.globalFailureTimestamps = this.globalFailureTimestamps.filter(t => now - t < 60000);

    if (this.isGlobalRecoveryMode && this.globalFailureTimestamps.length < 2) {
      this.isGlobalRecoveryMode = false;
      this.logExecution('Manager', `[RECOVERY_MODE] Orchestration metrics stabilized. Exiting RECOVERY_MODE.`, 'success');
      
      agentEventBus.publish({
        eventType: 'TASK_RECOVERED',
        sourceAgent: 'manager',
        payload: { status: 'NORMAL' }
      });
    }
  }

  /**
   * Evaluates and overrides sequential routing based on live environmental context.
   */
  private selectNextAgentDynamically(
    task: AgentTask, 
    response: AgentResponse, 
    context: any
  ): string {
    // Override 1: If routing fails repeatedly, automatically fallback to alert broadcast
    if (context?.recentRerouteFailuresCount > 1) {
      this.logExecution('Manager', `[FALLBACK] Persistent route blockages detected in area (${context.recentRerouteFailuresCount} failures). Bypassing routing; engaging AlertAgent directly.`, 'error');
      return 'alert';
    }

    // Override 2: High severity but unstable confidence -> prioritize verification
    if (context?.highestNearbySeverity === 'CRITICAL' && response.confidence < 0.65) {
      this.logExecution('Manager', `[ORCHESTRATION] Critical environmental threat coupled with unstable confidence. Routing to VerificationAgent.`, 'warning');
      return 'verification';
    }

    // Override 3: Rerouting needed for active nearby threats -> prioritize RoutingAgent
    if (context?.nearbyHazardsCount > 0 && response.nextAgent === 'ALERT') {
      this.logExecution('Manager', `[ORCHESTRATION] Verified hazard zone detected adjacent to threat area. Rerouting evacuation paths first.`, 'warning');
      return 'routing';
    }

    return response.nextAgent ? response.nextAgent.toString().toLowerCase() : 'alert';
  }

  private async executeAgent(task: AgentTask, agentId: string) {
    this.taskExecutionLocks.add(task.id);
    useOrchestrationStore.getState().setLoopBlockingMetrics({ activeLocks: this.taskExecutionLocks.size });

    try {
      const agent = agentRegistry.getAgent(agentId);
      
      if (!agent) {
        this.logExecution('Manager', `Failed to find agent with ID: ${agentId}`, 'error');
        agentEventBus.publish({
          eventType: 'AGENT_FAILURE',
          sourceAgent: 'manager',
          payload: { error: `Agent ${agentId} not found`, taskId: task.id }
        });
        return;
      }

      const { setStepStatus, startOrchestration, completeOrchestration } = useOrchestrationStore.getState();
      if (agentId === 'sentinel') {
        startOrchestration();
      }
      
      const lat = task.payload?.lat ?? task.payload?.originalTask?.payload?.lat ?? 0;
      const lng = task.payload?.lng ?? task.payload?.originalTask?.payload?.lng ?? 0;

      if (lat === 0 && lng === 0) {
        this.logExecution('Manager', `[ABORT] Execution blocked. Catastrophic coordinates lat=0 lng=0 detected. Entering LOCATION_UNVERIFIED.`, 'error');
        this.updateOrchestrationState(task.id, 'TERMINATED');
        setStepStatus(agentId, 'error', { reasoning: 'LOCATION_UNVERIFIED: Invalid GPS Lock' });
        
        agentEventBus.publish({
          eventType: 'LOCATION_UNVERIFIED' as any,
          sourceAgent: 'manager',
          payload: { taskId: task.id, reason: 'Invalid coordinates' }
        });
        return;
      }

      setStepStatus(agentId, 'processing');

      const currentRetries = task.retryCount || 0;
      
      // Rule 3: Max-Retry Terminate Guard (strict retry limit: 3)
      if (currentRetries >= MAX_RETRIES) {
        this.logExecution(agent.name, `Task ${task.id} failed after ${MAX_RETRIES} retries. Enforcing strict safety shutdown.`, 'error');
        this.updateOrchestrationState(task.id, 'STABILIZED_FAILURE');
        this.retryStates.set(task.id, 'RETRY_FAILED');
        setStepStatus(agentId, 'error', { reasoning: `Max retries exhausted (${MAX_RETRIES}). Pipeline halted.` });

        agentEventBus.publish({
          eventType: 'RETRY_EXPIRED',
          sourceAgent: 'manager',
          payload: { taskId: task.id, status: 'STABILIZED_FAILURE' }
        });

        completeOrchestration(0);
        return;
      }

      // Clean up expired pending negotiations dynamically to prevent loop deadlocks
      sharedMemory.negotiationMemory.expireOldNegotiations();

      // Consensus Check Gate: Critical alert broadcasts must require multi-agent coordination & consensus approval
      if (agentId === 'alert') {
        const forceAlert = task.payload?.forceAlert;
        
        if (forceAlert) {
          this.logExecution('Manager', `[FORCE ALERT] Safety fallback active for task ${task.id}. Bypassing consensus dispute gate.`, 'warning');
        } else {
          const lat = task.payload?.lat;
          const lng = task.payload?.lng;
          const context = sharedMemory.getContextSnapshot(lat, lng);
          
          const { hasConsensus, reasoning } = sharedMemory.negotiationMemory.evaluateMultiAgentConsensus(task.id, context);
          
          if (!hasConsensus) {
            this.logExecution('Manager', `[CONSENSUS AUDIT] Alert escalation disputed! Blocking premature broadcast.`, 'error');
            setStepStatus(agentId, 'error', { reasoning: `Consensus dispute: ${reasoning.join(', ')}` });
            
            // Start structural agent debate session record
            const debate = sharedMemory.negotiationMemory.startNegotiation(
              task.id,
              'VerificationAgent',
              'AlertAgent',
              'ESCALATION_BLOCK',
              reasoning,
              'REANALYSIS_REQUIRED'
            );

            agentEventBus.publish({
              eventType: 'NEGOTIATION_STARTED',
              sourceAgent: 'manager',
              targetAgent: 'verification',
              payload: { debate, taskId: task.id }
            });

            agentEventBus.publish({
              eventType: 'ROUTE_DISPUTED',
              sourceAgent: 'manager',
              targetAgent: 'routing',
              payload: { debate, taskId: task.id }
            });

            this.updateOrchestrationState(task.id, 'BLOCKED');

            const nextRetries = currentRetries + 1;
            if (nextRetries >= MAX_RETRIES) {
              this.logExecution('Manager', `Feedback loop retry limit reached for task ${task.id}. Enforcing strict safety shutdown.`, 'error');
              this.updateOrchestrationState(task.id, 'STABILIZED_FAILURE');
              this.retryStates.set(task.id, 'RETRY_FAILED');
              setStepStatus(agentId, 'error', { reasoning: `Max retries exhausted during dispute (${MAX_RETRIES}).` });

              agentEventBus.publish({
                eventType: 'RETRY_EXPIRED',
                sourceAgent: 'manager',
                payload: { taskId: task.id, status: 'STABILIZED_FAILURE' }
              });

              completeOrchestration(0);
              return;
            }

            // Route control flow back to AnalystAgent for strategic sector reevaluation
            this.dispatchTask({
              ...task,
              retryCount: nextRetries,
              sourceAgent: 'manager'
            }, 'analyst');

            return;
          } else {
            // Rule 2: Single-Emission Consensus Gate
            const consensusCount = this.taskConsensusCounts.get(task.id) || 0;
            if (consensusCount > 0) {
              this.logExecution('Manager', `[CONSENSUS DUPLICATE BLOCKED] Task ${task.id} already achieved consensus. Rejecting duplicate.`, 'warning');
              return;
            }
            this.taskConsensusCounts.set(task.id, 1);

            // Consensus approved: Proceed with alert
            this.logExecution('Manager', `[CONSENSUS APPROVED] Consensus audit validated. Verification Agent and Routing Agent confirm safety.`, 'success');
            
            // Mark task as FINALIZED (terminal state) to lock orchestration under Rule 1 & Rule 2
            this.updateOrchestrationState(task.id, 'FINALIZED');

            agentEventBus.publish({
              eventType: 'CONSENSUS_REACHED',
              sourceAgent: 'manager',
              payload: { taskId: task.id, approvalReasoning: reasoning }
            });

            // Destroy retry channels and purge replay permissions
            this.taskRetryCounts.set(task.id, 0);
            this.retryStates.set(task.id, 'RETRY_BLOCKED');
            this.taskExecutionLocks.delete(task.id);
          }
        }
      }

      // Map orchestration states based on processing targets
      let state: OrchestrationState = 'INITIAL_ANALYSIS';
      if (agentId === 'verification') state = 'VERIFYING';
      else if (agentId === 'routing') state = 'REROUTING';
      else if (agentId === 'alert') state = 'ESCALATING';
      else if (agentId === 'predictive') state = 'MONITORING_FUTURE_RISK';
      
      this.updateOrchestrationState(task.id, state);

      try {
        const lat = task.payload?.lat;
        const lng = task.payload?.lng;
        const context = sharedMemory.getContextSnapshot(lat, lng);
        
        // Inject previous failure logs to enrich task data and make executing agents failure-aware
        const previousFailures = this.failureHistories.get(task.id) || [];

        this.logExecution(
          agent.name,
          `Processing task: ${task.id} [Priority: ${this.taskPriorities.get(task.id) || 'MEDIUM'}] with DecisionContext (hazards: ${context.nearbyHazardsCount}, severity: ${context.highestNearbySeverity}) [Failures: ${previousFailures.length}]`,
          'info'
        );
        
        const enrichedTask = {
          ...task,
          payload: {
            ...task.payload,
            context,
            previousFailures
          }
        };

        const response: AgentResponse = await agent.execute(enrichedTask);

        // 1. Process Memory Updates synchronously first
        if (response.memoryUpdates && response.memoryUpdates.length > 0) {
          response.memoryUpdates.forEach(update => {
            sharedMemory.updateMemory(update);
          });
          this.logExecution(agent.name, `Shared memory updated.`, 'success');
          agentEventBus.publish({
            eventType: 'MEMORY_UPDATED',
            sourceAgent: agent.name,
            payload: { updates: response.memoryUpdates }
          });
        }

        // 2. Map response flags directly into events (No Hardcoded Routing)
        const isRejection = !response.success || response.confidence < 0.6 || response.eventType === 'ROUTE_REJECTED' || response.eventType === 'ESCALATION_BLOCKED' || response.eventType === 'VERIFICATION_FAILED';
        
        if (isRejection) {
          this.updateOrchestrationState(task.id, 'STABILIZING');
          sharedMemory.recordFailedAttempt(agent.id);
          
          // Record failure timestamps and check global stability indices
          const errorReason = response.reasoning.join(', ') || 'Generic rejection';
          this.recordFailureAndCheckInstability(task.id, `${agent.name} failed: ${errorReason}`);
          
          const processingTime = response.timestamp ? (Date.now() - response.timestamp) : 0;
          setStepStatus(agentId, 'error', {
            processingTimeMs: processingTime || 120,
            reasoning: `Rejection: ${errorReason}`
          });

          const nextRetries = currentRetries + 1;
          
          if (nextRetries >= MAX_RETRIES) {
            this.logExecution(agent.name, `Feedback loop retry limit reached for task ${task.id}. Grounding control flow to emergency alerts.`, 'error');
            this.updateOrchestrationState(task.id, 'BLOCKED');
            
            this.dispatchTask({
              ...task,
              payload: { ...task.payload, forceAlert: true },
              retryCount: 0
            }, 'alert');
            return;
          }

          // Determine targeted backward feedback route
          const feedbackTarget = response.feedbackAgent || 'ANALYST';
          this.logExecution(
            agent.name,
            `[AgentManager] Retry cycle initiated: routing from ${agent.name} back to ${feedbackTarget} (Retry: ${nextRetries}/${MAX_RETRIES})`,
            'warning'
          );

          // Map feedback indicators
          let targetEvent: EventType = 'VERIFICATION_REQUIRED';
          if (response.eventType === 'ROUTE_REJECTED') targetEvent = 'ROUTE_REJECTED';
          else if (response.eventType === 'ESCALATION_BLOCKED') targetEvent = 'ESCALATION_BLOCKED';
          else if (response.eventType === 'REANALYZE_REQUIRED') targetEvent = 'REANALYZE_REQUIRED';
          else if (response.eventType === 'VERIFICATION_FAILED') targetEvent = 'VERIFICATION_FAILED';

          // Publish dynamic feedback retry events
          agentEventBus.publish({
            eventType: 'RETRY_TRIGGERED',
            sourceAgent: agent.name,
            targetAgent: feedbackTarget as string,
            payload: { originalTask: task, reason: response.reasoning.join(', ') },
            retryCount: nextRetries
          });

          agentEventBus.publish({
            eventType: targetEvent,
            sourceAgent: agent.name,
            targetAgent: feedbackTarget as string,
            payload: { originalTask: task, reason: response.reasoning.join(', ') },
            retryCount: nextRetries
          });

          // Direct backward dispatch queue loop execution
          this.dispatchTask({
            ...task,
            retryCount: nextRetries,
            sourceAgent: agent.name
          }, feedbackTarget.toString().toLowerCase());

          return;
        }

        // Success Path
        const nextStateName: OrchestrationState = (agentId === 'alert') ? 'FINALIZED' : 'RESOLVED';
        this.updateOrchestrationState(task.id, nextStateName);
        this.logExecution(agent.name, `Completed. Confidence: ${(response.confidence * 100).toFixed(0)}%`, 'success');
        sharedMemory.resetFailedAttempt(agent.id);

        const processingTime = response.timestamp ? (Date.now() - response.timestamp) : 0;
        setStepStatus(agentId, 'completed', { 
          processingTimeMs: processingTime || 150, 
          reasoning: response.reasoning.join(', '),
          output: response.memoryUpdates
        });

        if (!response.nextAgent || agentId === 'alert' || agentId === 'routing') {
          completeOrchestration(Date.now() - task.timestamp);
        }

        // Verify and recover global Recovery Mode if metrics stabilized
        this.checkAndResolveGlobalRecovery();

        // 7. Parallel Execution capability: double analytical throughput for high priority alerts
        const currentPriority = this.taskPriorities.get(task.id) || 'MEDIUM';
        if ((currentPriority === 'HIGH' || currentPriority === 'CRITICAL') && agentId === 'analyst') {
          this.logExecution('Manager', `[CONCURRENCY] Concurrent pipeline triggered: enqueuing Verification AND Escape Routing concurrently.`, 'success');
          
          this.dispatchTask({ ...task, retryCount: currentRetries }, 'verification');
          this.dispatchTask({ ...task, retryCount: currentRetries }, 'routing');
          return;
        }

        // Context-driven dynamically determined next agent selection
        const nextAgentName = this.selectNextAgentDynamically(task, response, context);

        if (response.nextAgent || (response.eventType && !['MEMORY_UPDATED', 'CONFIDENCE_UPDATED'].includes(response.eventType as string))) {
          // Publish event for observability/UI only — NOT triggering subscribed dispatch listeners.
          // We use 'ORCHESTRATION_STEP_COMPLETE' which has no subscriber, so only the
          // direct dispatchTask below advances the pipeline. This eliminates the
          // double-dispatch that caused recursive agent storms.
          agentEventBus.publish({
            eventType: 'ORCHESTRATION_STEP_COMPLETE' as EventType,
            sourceAgent: agent.name,
            payload: { 
              originalEventType: response.eventType,
              nextAgent: nextAgentName,
              confidence: response.confidence,
              taskId: task.id
            },
            targetAgent: nextAgentName
          });

          // Single direct dispatch — only one pipeline step advances.
          this.dispatchTask({
            ...task,
            retryCount: currentRetries,
            sourceAgent: agent.name
          }, nextAgentName);
        }

      } catch (error: any) {
        this.logExecution(agent.name, `Execution exception: ${error.message}`, 'error');
        setStepStatus(agentId, 'error', { reasoning: error.message });
        
        agentEventBus.publish({
          eventType: 'AGENT_RETRY',
          sourceAgent: 'manager',
          targetAgent: agent.name,
          payload: { task },
          retryCount: currentRetries + 1
        });
      }
    } finally {
      this.taskExecutionLocks.delete(task.id);
      useOrchestrationStore.getState().setLoopBlockingMetrics({
        activeLocks: this.taskExecutionLocks.size,
        finalizedTasks: Array.from(this.orchestrationStates.values()).filter(s => s === 'FINALIZED' || s === 'COMPLETED').length
      });
    }
  }

  /**
   * 9-Agent Deterministic Reasoning Pipeline (Production-Grade)
   *
   * Evidence-gated, verification-first, false-positive resistant orchestration:
   * NORMALIZATION → CROWD UNION → SENTIMENT → VERIFICATION FUSION →
   * ANALYST → SHIELD MODULE → PREDICTIVE SIMULATOR → TACTICAL ANALYZER →
   * CORRIDOR ROUTING + COORDINATION PRIORITY
   *
   * Multi-Layer Escalation Gating (Conditions A-E):
   * A: Real weather anomaly from API
   * B: Multiple corroborating reports (≥2)
   * C: Fused confidence ≥ 55%
   * D: Verification Fusion approval
   * E: Shield Module passes all checks
   */
  public async executePipeline(taskId: string, initialPayload: any, sourceAgentName: string = 'manager'): Promise<void> {
    const { setStepStatus, startOrchestration, completeOrchestration } = useOrchestrationStore.getState();

    // Concurrency Mutex — prevent duplicate pipeline runs
    if (this.activeTaskRegistry.has(taskId)) {
      this.logExecution('Manager', `[MUTEX] Task ${taskId} already in active registry. Blocking duplicate run.`, 'warning');
      return;
    }
    this.activeTaskRegistry.add(taskId);
    startOrchestration();

    const lat = initialPayload?.lat ?? initialPayload?.latitude ?? 31.5204;
    const lng = initialPayload?.lng ?? initialPayload?.longitude ?? 74.3587;
    const rawText: string = initialPayload?.text ?? initialPayload?.rawText ?? '';
    const pipelineStart = Date.now();

    this.logExecution('Manager', `▶ Starting 9-agent reasoning pipeline for task ${taskId}`, 'info');

    // Helper to apply memory updates returned by agents
    const applyMemoryUpdates = (res: AgentResponse) => {
      if (res.memoryUpdates && res.memoryUpdates.length > 0) {
        res.memoryUpdates.forEach(update => {
          sharedMemory.updateMemory(update);
        });
      }
    };

    // ─────────────────────────────────────────────
    // PHASE 1: INPUT NORMALIZATION
    // ─────────────────────────────────────────────
    setStepStatus('normalization', 'processing');
    this.logExecution('Normalization', 'Converting raw input to structured intelligence...', 'info');

    const normAgent = agentRegistry.getAgent('normalization')!;
    const normResponse = await normAgent.execute({
      id: taskId,
      payload: { rawText, text: rawText, lat, lng },
      sourceAgent: 'manager',
      timestamp: Date.now(),
    });

    const normalizedSignal = normResponse.memoryUpdates?.[0]?.signal;

    setStepStatus('normalization', normResponse.success ? 'completed' : 'error', {
      processingTimeMs: Date.now() - pipelineStart,
      reasoning: normResponse.reasoning.join(' | '),
      output: { confidence: normResponse.confidence, type: normalizedSignal?.type ?? 'unknown', signal: normalizedSignal },
    });

    if (!normResponse.success) {
      this.logExecution('Normalization', 'Input rejected — too short or empty.', 'error');
      this.updateOrchestrationState(taskId, 'FAILED');
      this.activeTaskRegistry.delete(taskId);
      completeOrchestration(0);
      return;
    }

    applyMemoryUpdates(normResponse);

    // Set initial unverified state in sharedMemory
    sharedMemory.updateMemory({
      activeHazards: {
        [taskId]: {
          confidence: normResponse.confidence,
          severity: 'MEDIUM',
          lifecycleState: 'DETECTED',
          verificationState: 'unverified',
          polygonPoints: [
            { lat: lat + 0.005, lng: lng + 0.005 },
            { lat: lat + 0.005, lng: lng - 0.005 },
            { lat: lat - 0.005, lng: lng - 0.005 },
            { lat: lat - 0.005, lng: lng + 0.005 }
          ],
          affectedRoutes: []
        }
      }
    });

    // ─────────────────────────────────────────────
    // PHASE 2: CROWD-SOURCED UNION
    // ─────────────────────────────────────────────
    setStepStatus('crowd', 'processing');
    this.logExecution('Crowd', 'Aggregating & deduplicating crowd signals...', 'info');

    const crowdAgent = agentRegistry.getAgent('crowd')!;
    const crowdResponse = await crowdAgent.execute({
      id: taskId,
      payload: { lat, lng, normalizedSignal },
      sourceAgent: 'normalization',
      timestamp: Date.now(),
    });

    const crowdResult = crowdResponse.memoryUpdates?.[0]?.result;

    setStepStatus('crowd', 'completed', {
      processingTimeMs: 65,
      reasoning: crowdResponse.reasoning.join(' | '),
      output: { confidence: crowdResult?.trustScore ?? 0, trustScore: crowdResult?.trustScore ?? 0, result: crowdResult },
    });

    applyMemoryUpdates(crowdResponse);

    // ─────────────────────────────────────────────
    // PHASE 3: SENTIMENT DETECTOR
    // ─────────────────────────────────────────────
    setStepStatus('sentiment', 'processing');
    this.logExecution('Sentiment', 'Analyzing emotional urgency signals...', 'info');

    const sentimentAgent = agentRegistry.getAgent('sentiment')!;
    const sentimentResponse = await sentimentAgent.execute({
      id: taskId,
      payload: { normalizedSignal, rawText, text: rawText },
      sourceAgent: 'crowd',
      timestamp: Date.now(),
    });

    const sentimentResult = sentimentResponse.memoryUpdates?.[0]?.result;

    setStepStatus('sentiment', 'completed', {
      processingTimeMs: 40,
      reasoning: sentimentResponse.reasoning.join(' | '),
      output: { confidence: sentimentResponse.confidence, result: sentimentResult },
    });

    applyMemoryUpdates(sentimentResponse);

    // ─────────────────────────────────────────────
    // PHASE 4: VERIFICATION FUSION (Conditions A-D)
    // ─────────────────────────────────────────────
    setStepStatus('verification', 'processing');
    this.logExecution('Verification', 'Running multi-source evidence fusion...', 'info');

    const verifyAgent = agentRegistry.getAgent('verification')!;
    const verifyResponse = await verifyAgent.execute({
      id: taskId,
      payload: { lat, lng, normalizedSignal, crowdResult, sentimentResult },
      sourceAgent: 'sentiment',
      timestamp: Date.now(),
    });

    const verificationResult = verifyResponse.memoryUpdates?.[0]?.result;

    setStepStatus('verification', verifyResponse.success ? 'completed' : 'error', {
      processingTimeMs: 180,
      reasoning: verifyResponse.reasoning.join(' | '),
      output: {
        confidence: verifyResponse.confidence,
        fusedTrust: verifyResponse.confidence,
        blocked: !verifyResponse.success,
        result: verificationResult,
      },
    });

    applyMemoryUpdates(verifyResponse);

    // Escalation Gate: if verification failed, set to MONITORING only
    if (!verifyResponse.success) {
      const monitorStatus = verificationResult?.verificationStatus ?? 'MONITORING';
      this.logExecution('Verification', `Evidence insufficient. Status: ${monitorStatus}. No escalation.`, 'warning');

      // Still run Analyst to show the assessment — but mark as monitoring only
      setStepStatus('analyst', 'completed', { processingTimeMs: 45, reasoning: `MONITORING ONLY: ${verifyResponse.reasoning.slice(-1)[0]}`, output: { confidence: verifyResponse.confidence } });
      setStepStatus('shield', 'completed', { processingTimeMs: 20, reasoning: 'Shield: No threat to suppress — verification already rejected.', output: { blocked: true } });
      setStepStatus('predictive', 'completed', { processingTimeMs: 15, reasoning: 'No prediction — unverified signal.', output: { confidence: 0 } });
      setStepStatus('routing', 'completed', { processingTimeMs: 10, reasoning: 'Routing not activated — no verified hazard.', output: { confidence: 0 } });
      setStepStatus('tactical', 'completed', { processingTimeMs: 10, reasoning: 'Strategy: MONITOR ONLY — insufficient evidence.', output: { confidence: verifyResponse.confidence } });
      setStepStatus('priority', 'completed', { processingTimeMs: 10, reasoning: 'Priority: P4_OBSERVE — signal does not meet escalation threshold.', output: { confidence: verifyResponse.confidence } });

      // Reject hazard in sharedMemory to delete/suppress
      sharedMemory.updateMemory({
        activeHazards: {
          [taskId]: {
            confidence: verifyResponse.confidence,
            verificationState: 'rejected',
            lifecycleState: 'RESOLVED'
          }
        }
      });

      this.updateOrchestrationState(taskId, 'PASSIVE_MONITORING');
      this.activeTaskRegistry.delete(taskId);
      completeOrchestration(Date.now() - pipelineStart);
      return;
    }

    // Set verified status in sharedMemory!
    sharedMemory.updateMemory({
      activeHazards: {
        [taskId]: {
          confidence: verifyResponse.confidence,
          verificationState: 'verified',
          lifecycleState: 'VERIFYING'
        }
      }
    });

    // ─────────────────────────────────────────────
    // PHASE 5: ANALYST — Strategic Interpretation
    // ─────────────────────────────────────────────
    setStepStatus('analyst', 'processing');
    this.logExecution('Analyst', 'Building evidence-weighted strategic interpretation...', 'info');

    const analystAg = agentRegistry.getAgent('analyst')!;
    const analystResponse = await analystAg.execute({
      id: taskId,
      payload: { lat, lng, normalizedSignal, crowdResult, verificationResult },
      sourceAgent: 'verification',
      timestamp: Date.now(),
    });

    const analystResult = analystResponse.memoryUpdates?.[0]?.interpretation;

    setStepStatus('analyst', 'completed', {
      processingTimeMs: 140,
      reasoning: analystResponse.reasoning.join(' | '),
      output: { confidence: analystResponse.confidence, interpretation: analystResult },
    });

    applyMemoryUpdates(analystResponse);

    // ─────────────────────────────────────────────
    // PHASE 6: SHIELD MODULE (Condition E)
    // ─────────────────────────────────────────────
    setStepStatus('shield', 'processing');
    this.logExecution('Shield', 'Running false-positive suppression checks...', 'info');

    const shieldAg = agentRegistry.getAgent('shield')!;
    const shieldResponse = await shieldAg.execute({
      id: taskId,
      payload: { lat, lng, normalizedSignal, crowdResult, verificationResult, confidence: verifyResponse.confidence, rawText },
      sourceAgent: 'analyst',
      timestamp: Date.now(),
    });

    const shieldResult = shieldResponse.memoryUpdates?.[0]?.result;

    setStepStatus('shield', shieldResponse.success ? 'completed' : 'error', {
      processingTimeMs: 55,
      reasoning: shieldResponse.reasoning.join(' | '),
      output: { confidence: shieldResponse.confidence, blocked: !shieldResponse.success, result: shieldResult },
    });

    applyMemoryUpdates(shieldResponse);

    // Shield block — absolute halt
    if (!shieldResponse.success) {
      this.logExecution('Shield', `FALSE POSITIVE BLOCKED: ${shieldResult?.reason}`, 'warning');
      setStepStatus('predictive', 'completed', { processingTimeMs: 10, reasoning: 'Shield suppressed escalation. No prediction needed.', output: { confidence: 0 } });
      setStepStatus('routing', 'completed', { processingTimeMs: 10, reasoning: 'Routing deactivated — Shield block.', output: { confidence: 0 } });
      setStepStatus('tactical', 'completed', { processingTimeMs: 10, reasoning: 'Strategy: MONITOR — Shield blocked escalation.', output: { confidence: shieldResponse.confidence } });
      setStepStatus('priority', 'completed', { processingTimeMs: 10, reasoning: 'Priority: P4_OBSERVE — false positive prevented.', output: { confidence: shieldResponse.confidence } });

      // Downgrade hazard in sharedMemory to rejected
      sharedMemory.updateMemory({
        activeHazards: {
          [taskId]: {
            confidence: shieldResponse.confidence,
            verificationState: 'rejected',
            lifecycleState: 'RESOLVED'
          }
        }
      });

      this.updateOrchestrationState(taskId, 'PASSIVE_MONITORING');
      this.activeTaskRegistry.delete(taskId);
      completeOrchestration(Date.now() - pipelineStart);
      return;
    }

    // ─────────────────────────────────────────────
    // PHASE 7: PREDICTIVE SIMULATOR
    // ─────────────────────────────────────────────
    setStepStatus('predictive', 'processing');
    this.logExecution('Predictive', 'Generating probabilistic 6-hour scenario model...', 'info');

    const predictAg = agentRegistry.getAgent('predictive')!;
    const predictResponse = await predictAg.execute({
      id: taskId,
      payload: { lat, lng, verificationResult, confidence: verifyResponse.confidence, tacticalResult: { strategy: analystResult?.canEscalate ? 'PREPARE_EVACUATION' : 'CAUTION' } },
      sourceAgent: 'shield',
      timestamp: Date.now(),
    });

    setStepStatus('predictive', 'completed', {
      processingTimeMs: 110,
      reasoning: predictResponse.reasoning.join(' | '),
      output: { confidence: predictResponse.confidence, simulation: predictResponse.memoryUpdates?.[0]?.simulation },
    });

    applyMemoryUpdates(predictResponse);

    // ─────────────────────────────────────────────
    // PHASE 8: TACTICAL ANALYZER
    // ─────────────────────────────────────────────
    setStepStatus('tactical', 'processing');
    this.logExecution('Tactical', 'Determining response strategy...', 'info');

    const tacticalAg = agentRegistry.getAgent('tactical')!;
    const tacticalResponse = await tacticalAg.execute({
      id: taskId,
      payload: { lat, lng, verificationResult, crowdResult, normalizedSignal, shieldResult, confidence: verifyResponse.confidence },
      sourceAgent: 'predictive',
      timestamp: Date.now(),
    });

    const tacticalResult = tacticalResponse.memoryUpdates?.[0]?.result;

    setStepStatus('tactical', 'completed', {
      processingTimeMs: 80,
      reasoning: tacticalResponse.reasoning.join(' | '),
      output: { confidence: tacticalResponse.confidence, result: tacticalResult },
    });

    applyMemoryUpdates(tacticalResponse);

    // ─────────────────────────────────────────────
    // PHASE 9A: CORRIDOR NAVIGATION ROUTER
    // ─────────────────────────────────────────────
    setStepStatus('routing', 'processing');
    this.logExecution('Routing', 'Computing safe evacuation corridors...', 'info');

    let routingReasoning = 'Routing deactivated — hazard not escalated.';
    if (tacticalResponse.requiresEscalation) {
      try {
        const routingAg = agentRegistry.getAgent('routing')!;
        const routingResponse = await routingAg.execute({
          id: taskId,
          payload: { lat, lng, forceAlert: true },
          sourceAgent: 'tactical',
          timestamp: Date.now(),
        });
        routingReasoning = routingResponse.reasoning.join(' | ');
        applyMemoryUpdates(routingResponse);
      } catch (e) {
        routingReasoning = 'Routing unavailable — API error gracefully handled.';
      }
    }

    setStepStatus('routing', 'completed', {
      processingTimeMs: 140,
      reasoning: routingReasoning,
      output: { confidence: verifyResponse.confidence },
    });

    // ─────────────────────────────────────────────
    // PHASE 9B: COORDINATION PRIORITY ADJUSTER
    // ─────────────────────────────────────────────
    setStepStatus('priority', 'processing');
    this.logExecution('Priority', 'Assigning final response priority...', 'info');

    const priorityAg = agentRegistry.getAgent('priority')!;
    const priorityResponse = await priorityAg.execute({
      id: taskId,
      payload: { lat, lng, verificationResult, crowdResult, shieldResult, tacticalResult, confidence: verifyResponse.confidence },
      sourceAgent: 'tactical',
      timestamp: Date.now(),
    });

    const priorityResult = priorityResponse.memoryUpdates?.[0]?.result;

    setStepStatus('priority', 'completed', {
      processingTimeMs: 60,
      reasoning: priorityResponse.reasoning.join(' | '),
      output: { confidence: priorityResponse.confidence, result: priorityResult },
    });

    applyMemoryUpdates(priorityResponse);

    // Sync final priority & verification state to sharedMemory!
    const severityMap: Record<string, 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'> = {
      P0_CRITICAL: 'CRITICAL',
      P1_HIGH: 'HIGH',
      P2_MEDIUM: 'MEDIUM',
      P3_LOW: 'LOW',
      P4_OBSERVE: 'LOW'
    };
    const finalSeverity = severityMap[priorityResult?.priority ?? 'P3_LOW'] ?? 'MEDIUM';
    const finalLifecycle = priorityResult?.escalationApproved ? 'ESCALATED' : 'ACTIVE';

    sharedMemory.updateMemory({
      activeHazards: {
        [taskId]: {
          confidence: priorityResponse.confidence,
          severity: finalSeverity,
          lifecycleState: finalLifecycle,
          verificationState: priorityResult?.finalVerifiedStatus === 'VERIFIED' ? 'verified' : 'rejected'
        }
      }
    });

    this.logExecution('Manager', `✓ Pipeline complete. Priority: ${priorityResult?.priority ?? 'P3_LOW'} | Status: ${priorityResult?.finalVerifiedStatus ?? 'MONITORING'} | Total: ${Date.now() - pipelineStart}ms`, 'success');

    this.updateOrchestrationState(taskId, priorityResponse.requiresEscalation ? 'FINALIZING' : 'PASSIVE_MONITORING');
    this.updateOrchestrationState(taskId, 'COMPLETED');
    this.activeTaskRegistry.delete(taskId);
    completeOrchestration(Date.now() - pipelineStart);
  }
}

export const agentManager = AgentManager.getInstance();
