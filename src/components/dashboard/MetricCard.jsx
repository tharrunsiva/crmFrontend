import React from 'react';
import { motion } from 'framer-motion';

const MetricCard = ({ title, value, icon, color = 'primary', subtitle, delay = 0 }) => {
  const getIconColor = () => {
    switch (color) {
      case 'primary': return 'bg-primary-subtle text-primary';
      case 'success': return 'bg-success-subtle text-success';
      case 'warning': return 'bg-warning-subtle text-warning';
      case 'danger': return 'bg-danger-subtle text-danger';
      case 'indigo': return 'bg-info-subtle text-info';
      default: return 'bg-primary-subtle text-primary';
    }
  };

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, delay }}
      className="glass-card p-4 d-flex align-items-center justify-content-between h-100"
    >
      <div className="overflow-hidden">
        <span className="text-muted d-block mb-1" style={{ fontSize: '0.85rem', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {title}
        </span>
        <h2 className="m-0 text-main font-weight-bold mb-1" style={{ fontSize: '2rem' }}>{value}</h2>
        {subtitle && <small className="text-muted text-truncate d-block">{subtitle}</small>}
      </div>
      <div
        className={`rounded-3 d-flex align-items-center justify-content-center ${getIconColor()}`}
        style={{ width: '56px', height: '56px', fontSize: '1.5rem' }}
      >
        <i className={`bi ${icon}`}></i>
      </div>
    </motion.div>
  );
};

export default MetricCard;
