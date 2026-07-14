import React, { useState, useEffect } from 'react';
import * as mdijs from '@mdi/js';

const Icon = ({ icon, size = 24, color = 'currentColor', viewBox = '0 0 24 24' }) => {
  const [iconContent, setIconContent] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadIcon = async () => {
      setLoading(true);
      setIconContent('');

      try {
        const getIconPath = (name) => {
          if (!name) return '';
          if (name.startsWith('mdi')) return mdijs[name];

          const camelCaseName = 'mdi' + name
              .split(/[-_]/)
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join('');

          return mdijs[camelCaseName];
        };

        const path = getIconPath(icon);

        if (!path) {
          console.warn(`Icon "${icon}" not found in @mdi/js`);
          return <span style={{ width: size, height: size }} />;
        }

        setIconContent(path);
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

  return (
      <svg
          viewBox={viewBox}
          width={size}
          height={size}
          fill={color}
          style={{ fill: color }}
      >
        <path d={iconContent} />
      </svg>
  );
};

export default Icon;

