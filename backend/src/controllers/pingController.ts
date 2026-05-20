import { Request, Response } from 'express';

export const getPing = async (req: Request, res: Response): Promise<void> => {
  const start = process.hrtime();

  try {
    const diff = process.hrtime(start);
    const latencyMs = (diff[0] * 1e9 + diff[1]) / 1e6;

    res.status(200).json({
      pong: true,
      latency: `${latencyMs.toFixed(2)}ms`,
    });
  } catch (error) {
    res.status(500).json({
      pong: false,
      latency: '0ms',
      error: 'Ping failed',
    });
  }
};
