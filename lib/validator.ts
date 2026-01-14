export interface ValidationResult {
  valid: boolean;
  messages: string[];
}

export const validateReactCode = (code: string): ValidationResult => {
  const messages: string[] = [];

  // --- 1. React Attribute Naming (camelCase) ---
  if (/class\s*=\s*["']/.test(code)) {
    messages.push("⚠️ Found 'class' attribute. In React, use 'className'.");
  }
  if (/for\s*=\s*["']/.test(code)) {
    messages.push("⚠️ Found 'for' attribute. In React, use 'htmlFor'.");
  }
  if (/tabindex\s*=\s*["']/.test(code)) {
    messages.push("⚠️ Found 'tabindex'. In React, use 'tabIndex'.");
  }
  if (/autoplay\s*=\s*["']/.test(code)) {
    messages.push("⚠️ Found 'autoplay'. In React, use 'autoPlay'.");
  }
  
  // Check for common lowercase events
  const lowerCaseEvents = ['onclick', 'onchange', 'onmouseover', 'onmouseout', 'onkeydown', 'onkeyup', 'onsubmit'];
  lowerCaseEvents.forEach(evt => {
      const regex = new RegExp(`${evt}\\s*=\\s*["'{]`);
      if (regex.test(code)) {
          const fixed = evt.charAt(0) + evt.charAt(1) + evt.charAt(2).toUpperCase() + evt.slice(3);
          messages.push(`⚠️ Found '${evt}'. In React, use '${fixed}'.`);
      }
  });

  // --- 2. JSX/HTML Syntax ---
  if (/<!--/.test(code)) {
    messages.push("⚠️ Found HTML comment '<!--'. Use '{/* */}' for JSX comments.");
  }
  if (/style\s*=\s*["']/.test(code)) {
    messages.push("⚠️ Inline styles should be objects (style={{...}}), not strings.");
  }
  if (/<script/.test(code)) {
    messages.push("⚠️ Script tags are generally unsafe in React components.");
  }

  // --- 3. React Best Practices ---
  // Missing 'key' in .map() loops (Heuristic)
  if (/\.map\s*\(/.test(code) && !/key\s*=\s*[\{"]/.test(code)) {
    messages.push("⚠️ `.map()` loop detected but no 'key' prop found. Ensure lists have unique keys.");
  }

  // --- 4. Accessibility (a11y) ---
  if (/<img(?![^>]*\balt=)[^>]*>/.test(code)) {
    messages.push("⚠️ <img> tag missing 'alt' attribute.");
  }
  if (/<a\s+(?:[^>]*?\s+)?href=["'](?:#|)["']/.test(code)) {
    messages.push("⚠️ <a> tag has empty or '#' href. Ensure valid navigation or use <button>.");
  }
  if (/<a\s+[^>]*target=["']_blank["'](?![^>]*rel=["'][^"']*noreferrer[^"']*["'])[^>]*>/.test(code)) {
    messages.push("⚠️ target='_blank' links should have rel='noopener noreferrer'.");
  }

  // --- 5. Tailwind & CSS Class Validation ---
  const classNameRegex = /className\s*=\s*["'`]((?:[^"'`\\]|\\.)*)["'`]/g;
  let match;
  while ((match = classNameRegex.exec(code)) !== null) {
      const classString = match[1];
      const classes = classString.split(/\s+/);
      
      classes.forEach(cls => {
          if (!cls || cls.includes('${') || cls.includes('}')) return;
          
          // Hallucinated shortcuts / Invalid Tailwind
          if (['flex-center', 'flex-middle'].includes(cls)) {
              messages.push(`⚠️ '${cls}' is not standard. Use 'flex items-center justify-center'.`);
          }
          if (cls === 'flex-between') {
              messages.push(`⚠️ '${cls}' is not standard. Use 'flex justify-between'.`);
          }
          if (cls === 'text-body') {
              messages.push(`⚠️ '${cls}' is not standard. Use 'text-base' or 'text-gray-XXX'.`);
          }
          if (cls === 'align-center') {
              messages.push(`⚠️ '${cls}' is not standard. Use 'items-center' or 'text-center'.`);
          }
          
          // Legacy/Bootstrap confusions
          if (cls === 'container-fluid') messages.push("⚠️ 'container-fluid' is Bootstrap. Use 'w-full px-4' or just 'container'.");
          if (cls === 'd-flex') messages.push("⚠️ 'd-flex' is Bootstrap. Use 'flex'.");
          if (cls.startsWith('col-') && !cls.startsWith('col-span-') && !cls.startsWith('col-start-') && !cls.startsWith('col-end-')) {
             messages.push(`⚠️ '${cls}' looks like Bootstrap. Use 'grid-cols-*' or 'col-span-*'.`);
          }

          // Logical conflicts & Structure
          const hasFlex = classString.includes('flex') || classString.includes('inline-flex');
          const hasGrid = classString.includes('grid') || classString.includes('inline-grid');

          if ((cls === 'flex-col' || cls === 'flex-row' || cls === 'flex-wrap') && !hasFlex) {
              messages.push(`⚠️ '${cls}' has no effect without 'flex' or 'inline-flex'.`);
          }
          // Heuristic: justify/items usually need flex/grid parent.
          if ((cls.startsWith('justify-') || cls.startsWith('items-')) && !hasFlex && !hasGrid && !cls.includes('self')) {
              messages.push(`⚠️ '${cls}' usually needs a 'flex' or 'grid' parent.`);
          }
          if (cls.startsWith('gap-') && !hasFlex && !hasGrid) {
              messages.push(`⚠️ '${cls}' works best with 'flex' or 'grid'.`);
          }

          // Pixel Values in Layout Properties (Avoid strict pixels for responsiveness)
          if (/^[whmp][trblxy]?-\[\d+px\]/.test(cls)) {
             messages.push(`⚠️ Avoid fixed pixels '${cls}'. Use Tailwind utilities (e.g. w-4) or percentages.`);
          }
          
          // Mobile Viewport Unit Check
          if (/-\[\d+vh\]/.test(cls)) {
             messages.push(`⚠️ Avoid 'vh' for mobile '${cls}'. Use 'dvh' or 'min-h-screen' to avoid address bar jumping.`);
          }

          // CSS Property Mix-ups
          if (cls === 'width-full') messages.push("⚠️ 'width-full' is invalid. Use 'w-full'.");
          if (cls === 'height-full') messages.push("⚠️ 'height-full' is invalid. Use 'h-full'.");
          if (cls === 'bg-white-500') messages.push("⚠️ 'bg-white-500' is invalid. Use 'bg-white'.");
          if (cls === 'text-black-500') messages.push("⚠️ 'text-black-500' is invalid. Use 'text-black'.");
          
          // Color Shades Check
          const safeColors = ['white', 'black', 'transparent', 'current', 'inherit', 'auto'];
          const colorMatch = cls.match(/^(bg|text|border|ring|fill|stroke)-([a-z]+)$/);
          if (colorMatch) {
              const colorName = colorMatch[2];
              // Standard tailwind colors that typically need a weight
              const standardColors = ['slate','gray','zinc','neutral','stone','red','orange','amber','yellow','lime','green','emerald','teal','cyan','sky','blue','indigo','violet','purple','fuchsia','pink','rose'];
              
              if (standardColors.includes(colorName) && !safeColors.includes(colorName)) {
                  messages.push(`⚠️ '${cls}' might be missing a shade (e.g., ${cls}-500).`);
              }
          }
      });
  }

  // Deduplicate
  const uniqueMessages = Array.from(new Set(messages));

  return {
    valid: uniqueMessages.length === 0,
    messages: uniqueMessages
  };
};