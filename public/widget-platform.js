/**
 * 5me Reviews Widget Platform Loader
 * 
 * Usage:
 * <script src="https://5me.vercel.app/widget-platform.js" data-widget-id="YOUR_WIDGET_ID"></script>
 * 
 * Optional attributes:
 * - data-lazy="true" - Enable lazy loading with IntersectionObserver
 * - data-container="css-selector" - Custom container selector
 */
(function() {
  'use strict';

  var WIDGET_BASE_URL = 'https://5me.vercel.app';
  var SCRIPT_TAG = document.currentScript;
  
  // Get configuration from script tag
  var widgetId = SCRIPT_TAG && SCRIPT_TAG.getAttribute('data-widget-id');
  var lazyLoad = SCRIPT_TAG && SCRIPT_TAG.getAttribute('data-lazy') === 'true';
  var containerSelector = SCRIPT_TAG && SCRIPT_TAG.getAttribute('data-container');
  
  if (!widgetId) {
    console.error('[5me] Missing data-widget-id attribute');
    return;
  }

  /**
   * Create and inject the widget iframe
   */
  function createWidget(container) {
    // Create iframe
    var iframe = document.createElement('iframe');
    iframe.src = WIDGET_BASE_URL + '/w/' + widgetId;
    iframe.id = 'rc-widget-' + widgetId;
    iframe.className = 'rc-widget-frame';
    iframe.frameBorder = '0';
    iframe.scrolling = 'no';
    iframe.allowTransparency = 'true';
    iframe.loading = lazyLoad ? 'lazy' : 'eager';
    
    // Initial styles
    iframe.style.cssText = [
      'width: 100%',
      'border: none',
      'display: block',
      'overflow: hidden',
      'min-height: 200px',
      'transition: height 0.2s ease-out'
    ].join(';');

    // Insert iframe
    container.appendChild(iframe);

    return iframe;
  }

  /**
   * Listen for height messages from widget
   */
  function setupHeightListener(iframe) {
    window.addEventListener('message', function(event) {
      // Security: Only accept messages from our domain
      if (event.origin !== WIDGET_BASE_URL) return;
      
      var data = event.data;
      if (data && data.type === 'rc-widget-height' && typeof data.height === 'number') {
        iframe.style.height = data.height + 'px';
      }
    });
  }

  /**
   * Find or create container element
   */
  function getContainer() {
    if (containerSelector) {
      var el = document.querySelector(containerSelector);
      if (el) return el;
      console.warn('[5me] Container not found:', containerSelector);
    }
    
    // Create container after script tag
    var container = document.createElement('div');
    container.className = 'rc-widget-container';
    container.setAttribute('data-widget-id', widgetId);
    
    if (SCRIPT_TAG && SCRIPT_TAG.parentNode) {
      SCRIPT_TAG.parentNode.insertBefore(container, SCRIPT_TAG.nextSibling);
    } else {
      document.body.appendChild(container);
    }
    
    return container;
  }

  /**
   * Initialize widget with lazy loading
   */
  function initWithLazyLoad(container) {
    // Create placeholder
    var placeholder = document.createElement('div');
    placeholder.className = 'rc-widget-placeholder';
    placeholder.style.cssText = [
      'min-height: 200px',
      'background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      'border-radius: 8px',
      'display: flex',
      'align-items: center',
      'justify-content: center',
      'color: #718096'
    ].join(';');
    placeholder.innerHTML = '<span>Loading reviews...</span>';
    container.appendChild(placeholder);

    // Use IntersectionObserver for lazy loading
    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (entry.isIntersecting) {
            // Remove placeholder and load widget
            container.removeChild(placeholder);
            var iframe = createWidget(container);
            setupHeightListener(iframe);
            observer.disconnect();
          }
        });
      }, {
        rootMargin: '100px', // Start loading 100px before visible
        threshold: 0
      });
      
      observer.observe(placeholder);
    } else {
      // Fallback for older browsers
      container.removeChild(placeholder);
      var iframe = createWidget(container);
      setupHeightListener(iframe);
    }
  }

  /**
   * Main initialization
   */
  function init() {
    var container = getContainer();
    
    if (lazyLoad) {
      initWithLazyLoad(container);
    } else {
      var iframe = createWidget(container);
      setupHeightListener(iframe);
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
