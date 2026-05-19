import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { COLORS, RADIUS, SPACING } from '@theme';
import { GlassCard } from '../ui/GlassCard';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  onSubmit: (data: { text: string; severity: string; location?: string }) => void;
  isProcessing: boolean;
}

export const InputIngestionPanel: React.FC<Props> = ({ onSubmit, isProcessing }) => {
  const [text, setText] = useState('');
  const [severity, setSeverity] = useState('medium');
  const [location, setLocation] = useState('');

  const handleSubmit = () => {
    if (!text.trim()) return;
    onSubmit({ text, severity, location });
    setText('');
    setLocation('');
  };

  return (
    <GlassCard style={styles.container} intensity={40}>
      <View style={styles.header}>
        <Ionicons name="terminal-outline" size={16} color={COLORS.primary} />
        <Text style={styles.title}>INTELLIGENCE INGESTION TERMINAL</Text>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Enter hazard description (e.g. Heavy flooding near canal...)"
        placeholderTextColor="rgba(255,255,255,0.3)"
        value={text}
        onChangeText={setText}
        multiline
      />

      <View style={styles.row}>
        <TextInput
          style={[styles.input, { flex: 1, marginBottom: 0 }]}
          placeholder="Optional: Specific Location"
          placeholderTextColor="rgba(255,255,255,0.3)"
          value={location}
          onChangeText={setLocation}
        />
        <View style={styles.severityPicker}>
          {['low', 'medium', 'high', 'critical'].map((s) => (
            <TouchableOpacity 
              key={s} 
              onPress={() => setSeverity(s)}
              style={[
                styles.sevBtn, 
                severity === s && { backgroundColor: getSevColor(s) }
              ]}
            >
              <View style={[styles.sevDot, { backgroundColor: getSevColor(s) }]} />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity 
        style={[styles.submitBtn, (!text.trim() || isProcessing) && styles.disabledBtn]} 
        onPress={handleSubmit}
        disabled={!text.trim() || isProcessing}
      >
        {isProcessing ? (
          <ActivityIndicator color="#FFF" size="small" />
        ) : (
          <>
            <Text style={styles.submitText}>SUBMIT TO AI PIPELINE</Text>
            <Ionicons name="flash" size={14} color="#FFF" />
          </>
        )}
      </TouchableOpacity>
    </GlassCard>
  );
};

const getSevColor = (s: string) => {
  switch (s) {
    case 'critical': return COLORS.critical;
    case 'high':     return COLORS.primary;
    case 'medium':   return COLORS.warning;
    case 'low':      return COLORS.success;
    default:         return COLORS.textMuted;
  }
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(251, 97, 56, 0.2)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 15,
  },
  title: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: 1.5,
  },
  input: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 8,
    padding: 12,
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 15,
  },
  severityPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 8,
    padding: 4,
    gap: 4,
  },
  sevBtn: {
    width: 30,
    height: 30,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sevDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    height: 44,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  disabledBtn: {
    opacity: 0.5,
  },
  submitText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  }
});
