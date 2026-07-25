import React, { useState, useEffect, useCallback } from 'react';
import { getTodayStatus, checkIn, checkOut } from '../../services/attendanceService.js';
import toast from 'react-hot-toast';
import { Spinner } from 'react-bootstrap';

const QuickActions = ({ onStatusChange }) => {
  const [time, setTime] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({
    hasCheckedIn: false,
    hasCheckedOut: false,
    record: null,
  });

  const fetchStatus = useCallback(async () => {
    try {
      const res = await getTodayStatus();
      if (res.success) {
        setStatus(res.data);
      }
    } catch (err) {
      console.warn('Unable to get today attendance');
    }
  }, []);

  useEffect(() => {
    // Tick clock
    const timer = setInterval(() => setTime(new Date()), 1000);
    fetchStatus();
    return () => {
      clearInterval(timer);
    };
  }, [fetchStatus]);

  const handlePunch = async () => {
    setLoading(true);
    try {
      if (!status.hasCheckedIn) {
        const res = await checkIn();
        if (res.success) {
          toast.success('Successfully checked in today');
          setStatus({
            hasCheckedIn: true,
            hasCheckedOut: false,
            record: res.data,
          });
          if (onStatusChange) onStatusChange();
        }
      } else {
        const res = await checkOut();
        if (res.success) {
          toast.success('Successfully checked out today');
          setStatus({
            hasCheckedIn: true,
            hasCheckedOut: true,
            record: res.data,
          });
          if (onStatusChange) onStatusChange();
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Action failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card p-4 d-flex flex-column justify-content-between h-100">
      <div>
        <h5 className="text-main font-weight-bold mb-3">Attendance Punch</h5>
        
        {/* Real-time Clock */}
        <div className="text-center py-3 my-2 bg-light-subtle rounded-3 border border-glass">
          <h2 className="m-0 text-primary font-weight-bold display-font" style={{ letterSpacing: '1px' }}>
            {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </h2>
          <small className="text-muted font-weight-medium">
            {time.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </small>
        </div>

        {/* Punch Details */}
        <div className="mt-3 d-flex flex-column gap-2" style={{ fontSize: '0.9rem' }}>
          <div className="d-flex justify-content-between border-bottom border-glass pb-2">
            <span className="text-muted">Punch In Status</span>
            <span className={status.hasCheckedIn ? 'text-success font-weight-bold' : 'text-muted'}>
              {status.hasCheckedIn ? 'Checked In' : 'Pending'}
            </span>
          </div>
          {status.hasCheckedIn && (
            <div className="d-flex justify-content-between border-bottom border-glass pb-2">
              <span className="text-muted">Check In Time</span>
              <span className="text-main font-weight-medium">
                {new Date(status.record?.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          )}
          {status.hasCheckedOut && (
            <div className="d-flex justify-content-between border-bottom border-glass pb-2">
              <span className="text-muted">Check Out Time</span>
              <span className="text-main font-weight-medium">
                {new Date(status.record?.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4">
        <button
          onClick={handlePunch}
          disabled={loading || status.hasCheckedOut}
          className={`btn w-100 py-3 d-flex align-items-center justify-content-center gap-2 btn-premium ${
            status.hasCheckedIn && !status.hasCheckedOut ? 'bg-danger' : ''
          }`}
          style={{
            borderRadius: '12px',
            background: status.hasCheckedIn && !status.hasCheckedOut 
              ? 'linear-gradient(135deg, #EF4444, #B91C1C)' 
              : undefined,
          }}
        >
          {loading ? (
            <Spinner animation="border" size="sm" />
          ) : (
            <>
              <i className={`bi ${status.hasCheckedIn ? 'bi-box-arrow-right' : 'bi-box-arrow-in-left'}`}></i>
              <span className="font-weight-bold">
                {!status.hasCheckedIn ? 'Check In Now' : status.hasCheckedOut ? 'Punch Completed' : 'Check Out Now'}
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default QuickActions;
