/**
 * Check if WebGPU is available in the browser
 */
export async function checkWebGPU(): Promise<{
  supported: boolean;
  adapter?: GPUAdapter;
  reason?: string;
}> {
  if (!navigator.gpu) {
    return {
      supported: false,
      reason: 'WebGPU is not supported in this browser. Use Chrome 113+, Edge 113+, or a recent version of Safari.',
    };
  }

  try {
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
      return {
        supported: false,
        reason: 'No GPU adapter found. Your GPU may not support WebGPU.',
      };
    }
    return { supported: true, adapter };
  } catch (e) {
    return {
      supported: false,
      reason: `WebGPU initialization failed: ${(e as Error).message}`,
    };
  }
}

/**
 * Get GPU memory info (approximate)
 */
export async function getGPUInfo(): Promise<{
  vendor: string;
  architecture: string;
  estimatedMemoryGB: number;
}> {
  try {
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) return { vendor: 'Unknown', architecture: 'Unknown', estimatedMemoryGB: 0 };

    // WebGPU doesn't expose memory directly, but we can estimate
    const info = await (adapter as any).requestAdapterInfo?.() || {};
    
    return {
      vendor: info.vendor || 'Unknown',
      architecture: info.architecture || 'Unknown',
      estimatedMemoryGB: 4, // Conservative estimate
    };
  } catch {
    return { vendor: 'Unknown', architecture: 'Unknown', estimatedMemoryGB: 0 };
  }
}
