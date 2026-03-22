'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';

export default function Hero() {
  return (
    <section style={{
      minHeight: '82vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 5%',
      position: 'relative',
      overflow: 'hidden',
      gap: '40px'
    }} className="bg-grid">
      
      {/* Mesh Glow Gradient Atmosphere */}
      <div style={{
        position: 'absolute',
        width: '500px',
        height: '500px',
        background: 'radial-gradient(ellipse at center, rgba(16, 185, 129, 0.06), transparent 70%)',
        bottom: '10%',
        right: '5%',
        zIndex: -1
      }} />

      {/* Left Column: Text Content */}
      <div style={{ flex: 1, textAlign: 'left', maxWidth: '600px', zIndex: 10 }}>
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          style={{
            fontSize: 'clamp(36px, 6vw, 64px)',
            fontWeight: 800,
            background: 'linear-gradient(135deg, #100E14 0%, rgba(16, 14, 20, 0.7) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            lineHeight: 1.1,
            letterSpacing: '-2px',
            marginBottom: '16px'
          }}
        >
          Track Performance. <br />
          <span style={{ color: 'var(--primary)' }}>Fund Global Impact.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          style={{
            color: 'var(--muted)',
            fontSize: '18px',
            lineHeight: 1.6,
            marginBottom: '40px',
            maxWidth: '500px'
          }}
        >
          Combine golf score tracking with charity fundraising. Engage in monthly pools supporting elite scale cause allocations.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}
        >
          <Link href="/auth/signup" className="btn-primary" style={{ fontSize: '17px', padding: '14px 32px', borderRadius: '12px' }}>
            Subscribe Now
          </Link>
          <Link href="/about" className="btn-secondary" style={{ fontSize: '17px', padding: '13px 31px', borderRadius: '12px' }}>
            Learn More
          </Link>
        </motion.div>
      </div>

      {/* Right Column: Floating Mockup featuring Generated Image */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, delay: 0.4 }}
        style={{
          flex: 1,
          position: 'relative',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '400px'
        }}
      >
        <div className="glass" style={{
          position: 'relative',
          width: '100%',
          maxWidth: '450px',
          height: '320px',
          padding: '8px',
          background: 'white',
          overflow: 'hidden',
          boxShadow: '0 20px 50px rgba(109, 40, 217, 0.08)',
          border: '1px solid rgba(109, 40, 217, 0.15)',
          transform: 'rotate(1deg)'
        }}>
          <Image
            src="/landing_golf_mockup.png"
            alt="Golf Analytics Dashboard representation"
            fill
            sizes="(max-width: 768px) 90vw, 450px"
            style={{
              objectFit: 'cover',
              borderRadius: '12px'
            }}
          />
        </div>

        {/* Small floating overlap card overlay */}
        <div className="glass" style={{
          position: 'absolute',
          bottom: '30px',
          right: '50px',
          padding: '20px',
          width: '220px',
          background: 'rgba(255,255,255,0.95)',
          zIndex: 4,
          textAlign: 'left',
          boxShadow: '0 10px 40px rgba(0,0,0,0.06)',
          transform: 'rotate(-2deg)'
        }}>
          <div style={{ fontSize: '12px', opacity: 0.6 }}>Active Impact Split</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--accent)' }}>$14,580</div>
        </div>
      </motion.div>
    </section>
  );
}
