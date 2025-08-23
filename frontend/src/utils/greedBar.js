/**
 * Greed Bar Utility for Exit or Die
 * 
 * Provides utilities for creating and updating the greed bar component
 * with smooth fills, proper pixel alignment, and responsive sizing.
 */

export class GreedBarRenderer {
  constructor(scene) {
    this.scene = scene;
  }

  /**
   * Creates a new greed bar with proper styling and components
   * @param {number} x - X position
   * @param {number} y - Y position 
   * @param {number} width - Bar width (default: 140)
   * @param {number} height - Bar height (default: 12)
   * @returns {Phaser.GameObjects.Container} - Container with bar components
   */
  createGreedBar(x, y, width = 140, height = 12) {
    const container = this.scene.add.container(x, y);
    
    // Bar background with rounded appearance
    const background = this.scene.add.graphics();
    background.fillStyle(0x1e1e24, 1);
    background.fillRoundedRect(-width/2, -height/2, width, height, height/2);
    
    // Bar fill (initially empty)
    const fill = this.scene.add.graphics();
    
    // Label text positioned to the right of the bar
    const label = this.scene.add.text(width/2 + 8, 0, '0/10', {
      fontSize: '11px',
      fill: '#feca57',
      fontFamily: 'Courier New'
    }).setOrigin(0, 0.5);
    
    container.add([background, fill, label]);
    
    // Store references for updates
    container.greedFill = fill;
    container.greedLabel = label;
    container.barWidth = width;
    container.barHeight = height;
    
    return container;
  }

  /**
   * Updates greed bar fill and label with smooth animations
   * @param {Phaser.GameObjects.Container} barContainer - The bar container
   * @param {number} value - Current greed value (0-10)
   * @param {number} max - Maximum greed value (default: 10)
   */
  updateGreedBar(barContainer, value, max = 10) {
    if (!barContainer || !barContainer.greedFill || !barContainer.greedLabel) {
      console.warn('Invalid greed bar container provided');
      return;
    }

    // Clamp and round values to prevent subpixel issues
    const clampedValue = Math.max(0, Math.min(max, Math.round(value)));
    const fillRatio = clampedValue / max;
    
    // Calculate fill width (pixel-perfect)
    const fillWidth = Math.round(barContainer.barWidth * fillRatio);
    const fillHeight = barContainer.barHeight;
    
    // Clear and redraw fill with gradient
    const fill = barContainer.greedFill;
    fill.clear();
    
    if (fillWidth > 0) {
      // Create gradient fill (gold to red-orange)
      const gradient = this.scene.add.graphics();
      
      // For small widths, use solid color to avoid gradient artifacts
      if (fillWidth < 20) {
        fill.fillStyle(0xf7b733, 1);
      } else {
        // Create gradient effect using multiple rectangles
        const steps = Math.min(fillWidth / 2, 10);
        for (let i = 0; i < steps; i++) {
          const stepWidth = fillWidth / steps;
          const ratio = i / (steps - 1);
          
          // Interpolate between gold (#f7b733) and red-orange (#fc4a1a)
          const r = Math.round(247 + (252 - 247) * ratio);
          const g = Math.round(183 + (74 - 183) * ratio);
          const b = Math.round(51 + (26 - 51) * ratio);
          const color = (r << 16) | (g << 8) | b;
          
          fill.fillStyle(color, 1);
          fill.fillRect(
            -barContainer.barWidth/2 + i * stepWidth, 
            -fillHeight/2, 
            stepWidth + 1, // Slight overlap to prevent gaps
            fillHeight
          );
        }
      }
      
      // Simple solid fill for performance if needed
      if (fillWidth >= 20) {
        fill.clear();
        fill.fillStyle(0xf7b733, 1);
      }
      
      fill.fillRoundedRect(
        -barContainer.barWidth/2, 
        -fillHeight/2, 
        fillWidth, 
        fillHeight, 
        fillHeight/2
      );
    }
    
    // Update label with proper formatting
    barContainer.greedLabel.setText(`${clampedValue}/${max}`);
    
    // Color coding for the label
    let labelColor = '#feca57'; // Default gold
    if (clampedValue >= max * 0.8) {
      labelColor = '#fc4a1a'; // Red-orange for high greed
    } else if (clampedValue >= max * 0.6) {
      labelColor = '#fd9644'; // Orange for medium-high greed
    }
    
    barContainer.greedLabel.setColor(labelColor);
  }

  /**
   * Creates a responsive font size based on viewport
   * @param {number} minSize - Minimum font size in pixels
   * @param {number} vwSize - Viewport width based size (as percentage)
   * @param {number} maxSize - Maximum font size in pixels
   * @returns {string} - CSS clamp string for responsive sizing
   */
  getResponsiveFontSize(minSize, vwSize, maxSize) {
    // For Phaser text objects, we'll calculate based on game scale
    const gameWidth = this.scene.scale.gameSize.width;
    const scaleFactor = gameWidth / 375; // Base width of 375px
    
    const calculatedSize = Math.max(minSize, Math.min(maxSize, vwSize * scaleFactor));
    return `${Math.round(calculatedSize)}px`;
  }
}

/**
 * Standalone utility function for updating greed bars
 * Compatible with both Phaser containers and DOM elements
 * @param {any} element - Greed bar element (Phaser container or DOM element)
 * @param {string} labelElement - Label element selector or reference
 * @param {number} value - Current value
 * @param {number} max - Maximum value
 */
export function updateGreedBar(element, labelElement, value, max) {
  if (!element) return;
  
  // Clamp values to prevent rendering issues
  const clampedValue = Math.max(0, Math.min(max, Math.round(value)));
  const fillPercentage = (clampedValue / max) * 100;
  
  // Handle DOM elements (if any external UI)
  if (element.style) {
    element.style.width = `${fillPercentage}%`;
  }
  
  // Handle label updates
  if (labelElement) {
    const labelText = `${clampedValue}/${max}`;
    if (typeof labelElement === 'string') {
      const label = document.querySelector(labelElement);
      if (label) label.textContent = labelText;
    } else if (labelElement.setText) {
      // Phaser text object
      labelElement.setText(labelText);
    } else if (labelElement.textContent !== undefined) {
      // DOM element
      labelElement.textContent = labelText;
    }
  }
}

export default GreedBarRenderer;