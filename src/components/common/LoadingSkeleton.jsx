import React from 'react';

export const CardSkeleton = () => {
  return (
    <div className="glass-card p-4 d-flex flex-column gap-3 h-100">
      <div className="skeleton-box" style={{ width: '40%', height: '20px' }}></div>
      <div className="skeleton-box" style={{ width: '70%', height: '36px' }}></div>
      <div className="skeleton-box" style={{ width: '90%', height: '14px' }}></div>
    </div>
  );
};

export const TableSkeleton = ({ rows = 5 }) => {
  const arr = Array.from({ length: rows });
  return (
    <div className="glass-card p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="skeleton-box" style={{ width: '20%', height: '24px' }}></div>
        <div className="skeleton-box" style={{ width: '10%', height: '32px' }}></div>
      </div>
      <div className="d-flex flex-column gap-3">
        {arr.map((_, i) => (
          <div key={i} className="d-flex justify-content-between align-items-center py-2 border-bottom border-light">
            <div className="skeleton-box" style={{ width: '30%', height: '16px' }}></div>
            <div className="skeleton-box" style={{ width: '15%', height: '16px' }}></div>
            <div className="skeleton-box" style={{ width: '20%', height: '16px' }}></div>
            <div className="skeleton-box" style={{ width: '10%', height: '24px' }}></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const ProfileSkeleton = () => {
  return (
    <div className="row g-4">
      <div className="col-md-4">
        <div className="glass-card p-4 text-center d-flex flex-column align-items-center gap-3">
          <div className="skeleton-box rounded-circle" style={{ width: '120px', height: '120px' }}></div>
          <div className="skeleton-box" style={{ width: '60%', height: '24px' }}></div>
          <div className="skeleton-box" style={{ width: '40%', height: '16px' }}></div>
        </div>
      </div>
      <div className="col-md-8">
        <div className="glass-card p-4 d-flex flex-column gap-4">
          <div className="skeleton-box" style={{ width: '30%', height: '28px' }}></div>
          <div className="row g-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="col-sm-6">
                <div className="skeleton-box mb-2" style={{ width: '40%', height: '14px' }}></div>
                <div className="skeleton-box" style={{ width: '80%', height: '20px' }}></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
