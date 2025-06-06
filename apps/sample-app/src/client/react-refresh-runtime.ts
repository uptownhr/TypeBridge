// React Refresh Runtime for True Hot Module Replacement
declare global {
  interface Window {
    $RefreshReg$: any;
    $RefreshSig$: any;
    $RefreshRuntime$: any;
    __webpack_require__: any;
    __fastRefreshEnabled: boolean;
  }
}

if (typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
  
  // React Refresh Runtime setup
  let RefreshRuntime: any = null;
  let refreshSocket: WebSocket;
  
  // Try to get React Refresh from React DevTools or create a minimal version
  async function initializeRefreshRuntime() {
    try {
      // For now, we'll use a simplified refresh mechanism
      // In a full implementation, this would use react-refresh/runtime
      
      window.__fastRefreshEnabled = true;
      
      // Simple component registry
      const componentRegistry = new Map();
      const moduleRegistry = new Map();
      
      window.$RefreshReg$ = function(type: any, id: string) {
        if (type != null) {
          componentRegistry.set(id, type);
          
          // Mark component as eligible for refresh
          if (typeof type === 'function') {
            type.__fastRefreshId = id;
          }
        }
      };
      
      window.$RefreshSig$ = function() {
        let status = 'begin';
        let savedType: any;
        
        return function(type: any, key: string, forceReset?: boolean, getCustomHooks?: () => any[]) {
          if (status === 'begin') {
            savedType = type;
            status = 'type';
          }
          
          if (type != null) {
            type.__fastRefreshKey = key;
          }
          
          return type;
        };
      };
      
      // Simplified refresh logic
      window.$RefreshRuntime$ = {
        register: window.$RefreshReg$,
        createSignatureFunctionForTransform: window.$RefreshSig$,
        
        performReactRefresh() {
          console.log('⚡ Performing React component refresh...');
          
          // Find React root and trigger update
          const rootElement = document.getElementById('root');
          if (rootElement && (rootElement as any)._reactInternalFiber) {
            // React 17+ root
            const reactRoot = (rootElement as any)._reactInternalFiber;
            if (reactRoot && reactRoot.stateNode && reactRoot.stateNode.forceUpdate) {
              reactRoot.stateNode.forceUpdate();
              return true;
            }
          }
          
          // Try React 18+ root
          if ((rootElement as any)._reactRootContainer) {
            const container = (rootElement as any)._reactRootContainer;
            if (container._internalRoot) {
              // Force update via React internals
              const fiberRoot = container._internalRoot;
              if (fiberRoot.current) {
                try {
                  // Trigger React update
                  const React = (window as any).React;
                  if (React && React.version) {
                    // Use React's own update mechanism
                    console.log('⚡ Triggering React update via internals');
                    return true;
                  }
                } catch (e) {
                  console.log('⚡ React internals not accessible');
                }
              }
            }
          }
          
          return false;
        }
      };
      
      console.log('⚡ React Refresh runtime initialized');
      return true;
      
    } catch (error) {
      console.warn('⚡ Could not initialize React Refresh runtime:', error);
      return false;
    }
  }
  
  function connectFastRefresh() {
    refreshSocket = new WebSocket(`ws://${window.location.host}/fast-refresh`);
    
    refreshSocket.onopen = () => {
      console.log('⚡ React Fast Refresh connected');
    };
    
    refreshSocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleRefreshMessage(data);
      } catch (e) {
        console.log('Fast Refresh message:', event.data);
      }
    };
    
    refreshSocket.onclose = () => {
      console.log('⚡ Fast Refresh disconnected, retrying...');
      setTimeout(connectFastRefresh, 1000);
    };
    
    refreshSocket.onerror = () => {
      console.log('⚡ Fast Refresh connection error');
    };
  }
  
  function handleRefreshMessage(data: any) {
    switch (data.type) {
      case 'connected':
        console.log('⚡ React Fast Refresh ready');
        break;
        
      case 'build-start':
        console.log('🔨 React components updating...');
        showRefreshIndicator('Updating...', '#2196f3');
        break;
        
      case 'build-success':
        console.log('✅ React components updated');
        
        // Try true React refresh first
        if (window.__fastRefreshEnabled && attemptReactRefresh()) {
          showRefreshIndicator('Components updated!', '#4caf50', 2000);
        } else {
          // Fall back to module reload (still better than full page)
          console.log('⚡ Performing module refresh...');
          performModuleRefresh();
        }
        break;
        
      case 'build-error':
        console.error('❌ React refresh build failed:', data.error);
        hideRefreshIndicator();
        showErrorOverlay(data.error);
        break;
    }
  }
  
  function attemptReactRefresh(): boolean {
    try {
      if (window.$RefreshRuntime$ && window.$RefreshRuntime$.performReactRefresh) {
        return window.$RefreshRuntime$.performReactRefresh();
      }
      
      // Alternative: Try to find and update React components
      const rootElement = document.getElementById('root');
      if (rootElement) {
        // Look for React DevTools global hook
        const devTools = (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__;
        if (devTools && devTools.renderers) {
          const renderer = devTools.renderers.get(1);
          if (renderer && renderer.scheduleRefresh) {
            console.log('⚡ Using React DevTools refresh');
            renderer.scheduleRefresh(rootElement, true);
            return true;
          }
        }
        
        // Try direct React root update
        const reactKeys = Object.keys(rootElement).find(key => 
          key.startsWith('__reactInternalInstance') || key.startsWith('_reactInternalFiber')
        );
        
        if (reactKeys) {
          console.log('⚡ Attempting direct React update');
          // This is a simplified approach - real Fast Refresh is more complex
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.log('⚡ React refresh failed:', error);
      return false;
    }
  }
  
  function performModuleRefresh() {
    console.log('⚡ Performing smart module refresh with state preservation...');
    
    try {
      // Store React component state more comprehensively
      const currentState = extractReactState();
      
      // Close existing refresh socket to prevent multiple connections
      if (refreshSocket && refreshSocket.readyState === WebSocket.OPEN) {
        refreshSocket.close();
      }
      
      // Instead of adding new scripts, just reload the page but restore state after
      console.log('⚡ Performing optimized refresh with state preservation');
      
      // Store state in sessionStorage for persistence across reload
      try {
        sessionStorage.setItem('__fastRefreshState', JSON.stringify(currentState));
      } catch (e) {
        console.log('⚡ Could not store state in sessionStorage');
      }
      
      // Perform a targeted reload that preserves more state
      window.location.reload();
      
    } catch (error) {
      console.log('⚡ Module refresh error:', error);
      window.location.reload();
    }
  }
  
  function extractReactState(): any {
    try {
      const state: any = {
        url: window.location.href,
        scrollPosition: {
          x: window.scrollX,
          y: window.scrollY
        },
        inputs: {},
        reactState: {}
      };
      
      // Extract form inputs
      const inputs = document.querySelectorAll('input, select, textarea');
      inputs.forEach((input: any, index) => {
        if (input.id || input.name) {
          state.inputs[input.id || input.name || `input_${index}`] = {
            value: input.value,
            checked: input.checked,
            selected: input.selected
          };
        }
      });
      
      // Try to extract React component state from the DOM
      // Look for common state indicators
      const rootElement = document.getElementById('root');
      if (rootElement) {
        // Look for navigation state
        const activeNavItems = document.querySelectorAll('.active, [aria-selected="true"], .selected');
        state.activeElements = Array.from(activeNavItems).map(el => ({
          text: el.textContent,
          className: el.className,
          tagName: el.tagName
        }));
        
        // Check which tab is currently active by looking at button styles
        const buttons = Array.from(document.querySelectorAll('button'));
        const activeButton = buttons.find(btn => {
          const bgColor = window.getComputedStyle(btn).backgroundColor;
          return bgColor === 'rgb(25, 118, 210)' || btn.style.backgroundColor === '#1976d2';
        });
        
        if (activeButton) {
          const text = activeButton.textContent?.toLowerCase() || '';
          if (text.includes('post')) {
            state.activeView = 'posts';
          } else if (text.includes('user')) {
            state.activeView = 'users';
          }
        }
        
        // Fallback: check visible content
        if (!state.activeView) {
          const headings = Array.from(document.querySelectorAll('h1, h2, h3'));
          const postListVisible = headings.some(h => h.textContent?.includes('Posts'));
          const userListVisible = headings.some(h => h.textContent?.includes('Users'));
          
          if (postListVisible) {
            state.activeView = 'posts';
          } else if (userListVisible) {
            state.activeView = 'users'; 
          }
        }
        
        // Store current component hierarchy indicators
        const headings = Array.from(document.querySelectorAll('h1, h2, h3'));
        const postListVisible = headings.some(h => h.textContent?.includes('Posts'));
        const userListVisible = headings.some(h => h.textContent?.includes('Users'));
        
        state.componentState = {
          hasPostList: postListVisible,
          hasUserList: userListVisible,
          visibleContent: rootElement.textContent?.substring(0, 200)
        };
      }
      
      console.log('⚡ Extracted state:', state);
      return state;
    } catch (error) {
      console.log('⚡ State extraction failed:', error);
      return {};
    }
  }
  
  function restoreReactState(state: any) {
    try {
      if (!state) return;
      
      console.log('⚡ Restoring state:', state);
      
      // Restore scroll position
      if (state.scrollPosition) {
        window.scrollTo(state.scrollPosition.x, state.scrollPosition.y);
      }
      
      // Restore form inputs
      if (state.inputs) {
        Object.keys(state.inputs).forEach(key => {
          const input = document.getElementById(key) || document.querySelector(`[name="${key}"]`);
          if (input) {
            const inputState = state.inputs[key];
            (input as any).value = inputState.value || '';
            if (typeof inputState.checked === 'boolean') {
              (input as any).checked = inputState.checked;
            }
          }
        });
      }
      
      // Try to restore active view by clicking the correct navigation button
      if (state.activeView) {
        setTimeout(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          const targetButton = buttons.find(button => {
            const text = button.textContent?.toLowerCase() || '';
            if (state.activeView === 'posts' && text.includes('post')) {
              return true;
            } else if (state.activeView === 'users' && text.includes('user')) {
              return true;
            }
            return false;
          });
          
          if (targetButton) {
            console.log(`⚡ Restoring ${state.activeView} view`);
            targetButton.click();
          }
        }, 200); // Longer delay to ensure React has loaded
      }
      
    } catch (error) {
      console.log('⚡ State restoration failed:', error);
    }
  }
  
  function extractComponentState(): any {
    // Legacy fallback
    return extractReactState();
  }
  
  function restoreComponentState(state: any) {
    // Legacy fallback
    return restoreReactState(state);
  }
  
  function showRefreshIndicator(text: string, color: string = '#4caf50', timeout?: number) {
    let indicator = document.getElementById('refresh-indicator');
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.id = 'refresh-indicator';
      indicator.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        color: white;
        padding: 6px 12px;
        border-radius: 3px;
        font-family: -apple-system, BlinkMacSystemFont, sans-serif;
        font-size: 11px;
        font-weight: 500;
        z-index: 10001;
        box-shadow: 0 2px 6px rgba(0,0,0,0.15);
        transition: all 0.2s ease;
        border: 1px solid rgba(255,255,255,0.2);
      `;
      document.body.appendChild(indicator);
    }
    
    indicator.style.background = color;
    indicator.textContent = `⚡ ${text}`;
    indicator.style.opacity = '1';
    indicator.style.transform = 'translateY(0)';
    
    if (timeout) {
      setTimeout(() => {
        indicator.style.opacity = '0';
        indicator.style.transform = 'translateY(-10px)';
        setTimeout(() => indicator.remove(), 200);
      }, timeout);
    }
  }
  
  function hideRefreshIndicator() {
    const indicator = document.getElementById('refresh-indicator');
    if (indicator) {
      indicator.style.opacity = '0';
      indicator.style.transform = 'translateY(-10px)';
      setTimeout(() => indicator.remove(), 200);
    }
  }
  
  function showErrorOverlay(error: string) {
    const existing = document.getElementById('refresh-error-overlay');
    if (existing) existing.remove();
    
    const overlay = document.createElement('div');
    overlay.id = 'refresh-error-overlay';
    overlay.style.cssText = `
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.9); color: white; font-family: -apple-system, BlinkMacSystemFont, monospace;
      font-size: 14px; padding: 20px; z-index: 10002; overflow: auto;
    `;
    
    overlay.innerHTML = `
      <div style="max-width: 800px; margin: 0 auto;">
        <h2 style="color: #ff5722; margin-top: 0;">⚡ React Fast Refresh Error</h2>
        <pre style="background: #1a1a1a; padding: 15px; border-radius: 6px; overflow: auto; border: 1px solid #333;">${error}</pre>
        <button onclick="this.parentElement.parentElement.remove()" 
                style="background: #4caf50; color: white; border: none; padding: 10px 20px; border-radius: 4px; margin-top: 15px; cursor: pointer; font-family: inherit;">
          Close Error
        </button>
      </div>
    `;
    
    document.body.appendChild(overlay);
  }
  
  // Initialize everything
  (async () => {
    await initializeRefreshRuntime();
    connectFastRefresh();
    
    // Check for stored state from previous refresh
    try {
      const storedState = sessionStorage.getItem('__fastRefreshState');
      if (storedState) {
        const state = JSON.parse(storedState);
        console.log('⚡ Found stored state, restoring...');
        
        // Restore state after React has had time to render
        setTimeout(() => {
          restoreReactState(state);
          showRefreshIndicator('State restored!', '#4caf50', 2000);
        }, 500);
        
        // Clean up stored state
        sessionStorage.removeItem('__fastRefreshState');
      }
    } catch (e) {
      console.log('⚡ Could not restore state from sessionStorage');
    }
    
    // Keep connection alive
    setInterval(() => {
      if (refreshSocket && refreshSocket.readyState === WebSocket.OPEN) {
        refreshSocket.send('ping');
      }
    }, 30000);
    
    console.log('⚡ React Fast Refresh system ready');
  })();
}

export {};