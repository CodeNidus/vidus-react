import React, { useState, useEffect } from 'react';

const Icon = ({ icon, size = 24, color = 'currentColor', viewBox = '0 0 24 24' }) => {
  const [iconContent, setIconContent] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadIcon = async () => {
      setLoading(true);
      setIconContent('');

      try {
        // Dynamic import from @mdi/svg
        const iconModule = await import(`@mdi/svg/svg/${icon}.svg`);
        const response = await fetch(iconModule.default);
        const svgContent = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(svgContent, 'image/svg+xml');
        const pathElement = doc.querySelector('path');

        if (pathElement) {
          setIconContent(pathElement.outerHTML);
        } else {
          console.warn(`No path found in icon ${icon}`);
        }
      } catch (error) {
        console.error('Error loading icon:', error);
      } finally {
        setLoading(false);
      }
    };

    if (icon) {
      loadIcon();
    }
  }, [icon]);

  if (loading) {
    return <span></span>;
  }

  if (!iconContent) {
    return <span></span>;
  }

  return (
    <svg
      viewBox={viewBox}
      width={size}
      height={size}
      fill={color}
      dangerouslySetInnerHTML={{ __html: iconContent }}
    />
  );
};

export default Icon;

