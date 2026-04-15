import React from 'react';
import { Copy, QrCode, X } from 'lucide-react';

function BankTransferModal({
  isOpen,
  onClose,
  onConfirmPaid,
  isSubmitting = false,
  sellerBank,
  amount,
  transferNote
}) {
  if (!isOpen) {
    return null;
  }

  const amountValue = Number(amount || 0);
  const qrSrc = `https://img.vietqr.io/image/${encodeURIComponent(sellerBank.bankCode)}-${encodeURIComponent(sellerBank.accountNumber)}-compact2.png?amount=${encodeURIComponent(Math.round(amountValue))}&addInfo=${encodeURIComponent(transferNote || 'Lab Billiard Order')}&accountName=${encodeURIComponent(sellerBank.accountHolder)}`;

  const copyValue = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      // Clipboard can fail on insecure contexts; ignore quietly.
    }
  };

  return (
    <div className="transfer-modal-backdrop" role="presentation" onClick={onClose}>
      <section className="transfer-modal" role="dialog" aria-modal="true" aria-label="Bank transfer QR" onClick={(event) => event.stopPropagation()}>
        <div className="transfer-modal-head">
          <h2 className="transfer-modal-title">Scan QR to pay</h2>
          <button type="button" className="cart-icon-button" onClick={onClose} aria-label="Close bank transfer modal">
            <X className="cart-icon" />
          </button>
        </div>

        <div className="transfer-modal-body">
          <div className="transfer-qr-wrap">
            <img src={qrSrc} alt="Seller bank transfer QR" className="transfer-qr-image" loading="eager" />
          </div>

          <div className="transfer-info">
            <p className="transfer-info-row"><span>Bank</span><strong>{sellerBank.bankName}</strong></p>
            <p className="transfer-info-row"><span>Account number</span><strong>{sellerBank.accountNumber}</strong></p>
            <p className="transfer-info-row"><span>Account holder</span><strong>{sellerBank.accountHolder}</strong></p>
            <p className="transfer-info-row"><span>Amount</span><strong>${amountValue.toFixed(2)}</strong></p>
            <p className="transfer-info-row"><span>Transfer note</span><strong>{transferNote}</strong></p>
          </div>

          <div className="transfer-copy-actions">
            <button type="button" className="transfer-copy-btn" onClick={() => copyValue(sellerBank.accountNumber)}>
              <Copy className="transfer-copy-icon" />
              Copy account number
            </button>
            <button type="button" className="transfer-copy-btn" onClick={() => copyValue(String(Math.round(amountValue)))}>
              <QrCode className="transfer-copy-icon" />
              Copy amount
            </button>
            <button type="button" className="transfer-copy-btn" onClick={() => copyValue(transferNote || '')}>
              <Copy className="transfer-copy-icon" />
              Copy transfer note
            </button>
          </div>
        </div>

        <div className="transfer-modal-actions">
          <button type="button" className="cart-clear-btn" onClick={onClose} disabled={isSubmitting}>Cancel</button>
          <button type="button" className="cart-checkout-btn" onClick={onConfirmPaid} disabled={isSubmitting}>
            {isSubmitting ? 'Processing...' : 'I have transferred'}
          </button>
        </div>
      </section>
    </div>
  );
}

export default BankTransferModal;
