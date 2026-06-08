import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle2, XCircle, Loader2, ArrowLeft } from 'lucide-react';

function VNPayReturnPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); // loading | success | failed
  const [message, setMessage] = useState('');
  const [orderId, setOrderId] = useState('');

  useEffect(() => {
    const checkPayment = async () => {
      try {
        const params = Object.fromEntries(searchParams.entries());
        const response = await axios.get('http://localhost:5000/api/payment/vnpay/return', { params });

        if (response.data?.success) {
          setStatus('success');
          setMessage(response.data.message || 'Payment successful!');
          setOrderId(response.data.orderId || '');
        } else {
          setStatus('failed');
          setMessage(response.data.message || 'Payment failed');
        }
      } catch (err) {
        setStatus('failed');
        setMessage('Cannot verify payment. Please contact support.');
      }
    };

    checkPayment();
  }, [searchParams]);

  return (
    <main className="vnpay-return-page">
      <div className="vnpay-return-card">
        {status === 'loading' && (
          <>
            <Loader2 className="vnpay-return-icon vnpay-return-loading" size={64} />
            <h2 className="vnpay-return-title">Verifying payment...</h2>
            <p className="vnpay-return-text">Please wait a moment</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle2 className="vnpay-return-icon vnpay-return-success" size={64} />
            <h2 className="vnpay-return-title">Payment successful!</h2>
            <p className="vnpay-return-text">{message}</p>
            {orderId && (
              <p className="vnpay-return-order-id">
                Order code: <strong>#{String(orderId).slice(-8).toUpperCase()}</strong>
              </p>
            )}
            <div className="vnpay-return-actions">
              <button
                type="button"
                className="vnpay-return-btn vnpay-return-btn-primary"
                onClick={() => navigate('/')}
              >
                <ArrowLeft size={16} />
                Back to Home
              </button>
            </div>
          </>
        )}

        {status === 'failed' && (
          <>
            <XCircle className="vnpay-return-icon vnpay-return-error" size={64} />
            <h2 className="vnpay-return-title">Payment failed</h2>
            <p className="vnpay-return-text">{message}</p>
            <div className="vnpay-return-actions">
              <button
                type="button"
                className="vnpay-return-btn vnpay-return-btn-primary"
                onClick={() => navigate('/')}
              >
                <ArrowLeft size={16} />
                Back to Home
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

export default VNPayReturnPage;
