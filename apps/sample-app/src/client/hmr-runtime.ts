// React Fast Refresh Runtime for HMR
declare global {
  interface Window {
    $RefreshReg$: any;
    $RefreshSig$: any;
    __reactRefreshInjected: boolean;
  }
}

// Check if we're in development and on localhost
if (typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
  
  let hmrSocket: WebSocket;
  let moduleCache = new Map();
  
  // Initialize React Fast Refresh helpers
  if (!window.__reactRefreshInjected) {
    window.__reactRefreshInjected = true;
    
    // Mock React Fast Refresh for now (simplified version)
    window.$RefreshReg$ = (type: any, id: string) => {
      // Register component for refresh
      if (type && typeof type === 'function') {
        moduleCache.set(id, type);
      }
    };
    
    window.$RefreshSig$ = () => {
      return (type: any) => type;
    };
  }
  
  function connectHMR() {
    hmrSocket = new WebSocket(`ws://${window.location.host}/hmr`);
    
    hmrSocket.onopen = () => {
      console.log('🔥 React HMR connected');
    };
    
    hmrSocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleHMRMessage(data);
      } catch (e) {
        console.log('HMR message:', event.data);
      }
    };
    
    hmrSocket.onclose = () => {
      console.log('🔥 HMR disconnected, retrying...');
      setTimeout(connectHMR, 1000);
    };
    
    hmrSocket.onerror = () => {
      console.log('🔥 HMR connection error');
    };
  }
  
  function handleHMRMessage(data: any) {
    switch (data.type) {
      case 'connected':
        console.log('🔥 React Fast Refresh ready');
        break;
        
      case 'build-start':
        console.log('🔨 Building components...');
        showBuildIndicator();
        break;
        
      case 'build-success':
        console.log('✅ Components updated');
        hideBuildIndicator();
        
        // Try to do a soft update first
        if (canHotUpdate()) {
          performHotUpdate();
        } else {
          // Fall back to page reload if hot update isn't possible
          console.log('🔄 Full page refresh required');
          setTimeout(() => {
            window.location.reload();
          }, 100);
        }
        break;
        
      case 'build-error':
        console.error('❌ Build failed:', data.error);
        hideBuildIndicator();
        showErrorOverlay(data.error);
        break;
        
      case 'file-changed':
        console.log('📁 File changed:', data.file);
        break;
    }
  }
  
  function canHotUpdate(): boolean {
    // Simple check - for now we'll always do a soft reload
    // In a full implementation, this would check if the changes
    // can be applied without losing state
    return false; // Conservative approach for now
  }
  
  function performHotUpdate() {
    // In a full React Fast Refresh implementation, this would:
    // 1. Re-import the changed modules
    // 2. Update component definitions
    // 3. Re-render affected components while preserving state
    console.log('🔄 Hot updating components...');
    
    // For now, we'll just do a soft reload
    window.location.reload();
  }
  
  function showBuildIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'hmr-build-indicator';
    indicator.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: #1976d2;
      color: white;
      padding: 8px 16px;
      border-radius: 4px;
      font-family: monospace;
      font-size: 12px;
      z-index: 10000;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    `;
    indicator.textContent = '🔨 Building...';
    document.body.appendChild(indicator);
  }
  
  function hideBuildIndicator() {
    const indicator = document.getElementById('hmr-build-indicator');
    if (indicator) {
      indicator.remove();
    }
  }
  
  function showErrorOverlay(error: string) {
    // Remove existing overlay
    const existing = document.getElementById('hmr-error-overlay');
    if (existing) {
      existing.remove();
    }
    
    const overlay = document.createElement('div');
    overlay.id = 'hmr-error-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.8);
      color: white;
      font-family: monospace;
      font-size: 14px;
      padding: 20px;
      z-index: 10000;
      overflow: auto;
    `;
    
    overlay.innerHTML = `
      <div style="max-width: 800px; margin: 0 auto;">
        <h2 style="color: #ff6b6b; margin-top: 0;">❌ Build Error</h2>
        <pre style="background: #2d2d2d; padding: 20px; border-radius: 4px; overflow: auto;">${error}</pre>
        <button onclick="this.parentElement.parentElement.remove()" 
                style="background: #1976d2; color: white; border: none; padding: 10px 20px; border-radius: 4px; margin-top: 10px; cursor: pointer;">
          Close
        </button>
      </div>
    `;
    
    document.body.appendChild(overlay);
  }
  
  // Connect to HMR
  connectHMR();
  
  // Keep connection alive
  setInterval(() => {
    if (hmrSocket && hmrSocket.readyState === WebSocket.OPEN) {
      hmrSocket.send('ping');
    }
  }, 30000);
  
  console.log('🔥 React HMR runtime initialized');
}

export {};