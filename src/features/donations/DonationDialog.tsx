import donationQr from '../../../assets/donation-gpay-qr.png';
import { Icon } from '../../components/icons/Icon';

interface DonationDialogProps {
  open: boolean;
  onClose(): void;
}

export function DonationDialog({ open, onClose }: DonationDialogProps) {
  if (!open) return null;
  return (
    <div className="modal-layer donation-layer" onMouseDown={onClose}>
      <section className="donation-dialog" role="dialog" aria-modal="true" aria-label="Support Aetherium" onMouseDown={(event) => event.stopPropagation()}>
        <header>
          <div><span><Icon name="heart" size={17} /></span><div><p className="eyebrow">Keep the orbit alive</p><h2>Support Aetherium</h2></div></div>
          <button onClick={onClose} aria-label="Close donation dialog"><Icon name="close" size={16} /></button>
        </header>
        <main>
          <div className="donation-dialog__copy">
            <span className="donation-dialog__mark"><Icon name="aetherium" size={34} /></span>
            <h3>Help shape what comes next.</h3>
            <p>Aetherium is free to use. If it helps you build, an optional donation supports continued development, polish, and future releases.</p>
            <div className="donation-dialog__principles">
              <span><Icon name="check" size={12} /> No subscription</span>
              <span><Icon name="check" size={12} /> No feature locking</span>
              <span><Icon name="check" size={12} /> Choose any amount</span>
            </div>
            <p className="donation-dialog__note">Donations are voluntary and do not purchase digital goods, unlock features, or create recurring payments.</p>
          </div>
          <div className="donation-dialog__payment">
            <div className="donation-dialog__qr"><img src={donationQr} alt="Google Pay donation QR code" /></div>
            <strong>Scan to donate</strong>
            <span>Open Google Pay or another compatible UPI app and choose any amount.</span>
          </div>
        </main>
        <footer><span>CREATED BY</span><strong>FAHD AHMED</strong><i /></footer>
      </section>
    </div>
  );
}
