import React from 'react';

function Footer() {
  return (
    <footer className="site-footer" aria-label="Footer links and brand information">
      <div className="footer-top">
        <div className="footer-column">
          <h3 className="footer-title">Orders</h3>
          <ul className="footer-links">
            <li><a href="/">Order Status</a></li>
            <li><a href="/">Payment &amp; Shipping</a></li>
            <li><a href="/">Returns</a></li>
            <li><a href="/">Warranty</a></li>
            <li><a href="/">Terms and Conditions</a></li>
          </ul>
        </div>

        <div className="footer-column">
          <h3 className="footer-title">Support</h3>
          <ul className="footer-links">
            <li><a href="/">Support Center</a></li>
            <li><a href="/">Submit Request</a></li>
            <li><a href="/">Product Registration</a></li>
            <li><a href="/">Predator Rewards</a></li>
            <li><a href="/">Accessibility</a></li>
          </ul>
        </div>

        <div className="footer-column">
          <h3 className="footer-title">Innovation</h3>
          <ul className="footer-links">
            <li><a href="/">Best Pool Cues</a></li>
            <li><a href="/">25 Years of Innovation</a></li>
            <li><a href="/">Why Is Low Deflection Better?</a></li>
            <li><a href="/">Tables Sizes for Your Room</a></li>
            <li><a href="/">Making the Best Pool Tables</a></li>
          </ul>
        </div>

        <div className="footer-column">
          <h3 className="footer-title">Community</h3>
          <ul className="footer-links">
            <li><a href="/">Sponsored Events</a></li>
            <li><a href="/">Official Pro Billiard Series Equipment</a></li>
            <li><a href="/">Equipment Talk</a></li>
            <li><a href="/">Sponsorship Requests</a></li>
            <li><a href="/">News &amp; Guide Articles</a></li>
          </ul>
        </div>

        <div className="footer-column">
          <h3 className="footer-title">Company</h3>
          <ul className="footer-links">
            <li><a href="/">About Us</a></li>
            <li><a href="/">Store Locator</a></li>
            <li><a href="/">Careers</a></li>
            <li><a href="/">Privacy Policy</a></li>
            <li><a href="/">Contact</a></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
