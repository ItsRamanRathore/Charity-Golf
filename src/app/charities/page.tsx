import Navbar from '@/components/Navbar';
import { supabase } from '@/lib/supabase/public';
import Link from 'next/link';
import Image from 'next/image';

type Charity = {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  image_url: string | null;
  total_raised: number | null;
};

export const revalidate = 60; // Revalidate every minute

// Seed fallback charities if table is empty
const FALLBACK_CHARITIES: Charity[] = [
  {
    id: '1',
    name: 'Clean Water Alliance',
    description: 'Providing clean water access to underserved communities across Africa and Asia.',
    logo_url: 'https://via.placeholder.com/80?text=CWA',
    image_url: 'https://via.placeholder.com/400x200?text=Clean+Water',
    total_raised: 125000,
  },
  {
    id: '2',
    name: 'Global Education Fund',
    description: 'Supporting educational initiatives and school infrastructure in developing nations.',
    logo_url: 'https://via.placeholder.com/80?text=GEF',
    image_url: 'https://via.placeholder.com/400x200?text=Education',
    total_raised: 89750,
  },
  {
    id: '3',
    name: 'Forest Conservation Network',
    description: 'Protecting endangered forests and promoting sustainable reforestation programs globally.',
    logo_url: 'https://via.placeholder.com/80?text=FCN',
    image_url: 'https://via.placeholder.com/400x200?text=Forests',
    total_raised: 156320,
  },
];

export default async function CharitiesPage() {
  let charityList: Charity[] = FALLBACK_CHARITIES;

  try {
    const fetchPromise = supabase
      .from('charities')
      .select('*')
      .order('name');

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Query timeout')), 5000)
    );

    const result = (await Promise.race([
      fetchPromise,
      timeoutPromise as unknown as Promise<unknown>,
    ])) as unknown as { data: Charity[] | null };

    if (result.data && result.data.length > 0) {
      charityList = result.data as Charity[];
    }
  } catch (fetchError) {
    console.error('Error fetching charities:', fetchError);
  }

  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      
      <section style={{ padding: '80px 5%', textAlign: 'center' }}>
        <h1 style={{ fontSize: 'clamp(32px, 6vw, 48px)', fontWeight: 800, marginBottom: '16px' }}>
          Our Partner <span style={{ color: 'var(--accent)' }}>Charities</span>
        </h1>
        <p style={{ color: 'var(--muted)', maxWidth: '600px', margin: '0 auto 60px', lineHeight: 1.6 }}>
          Every subscription supports a cause. Explore the organizations making a real impact on communities and the environment.
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '32px',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          {charityList.map((charity) => (
            <div key={charity.id} className="glass" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ position: 'relative', height: '200px', width: '100%' }}>
                <Image
                  src={charity.image_url || 'https://via.placeholder.com/400x200?text=Charity'}
                  alt={charity.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 400px"
                  style={{ objectFit: 'cover' }}
                />
              </div>
              <div style={{ padding: '24px', flexGrow: 1, display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <Image
                    src={charity.logo_url || 'https://via.placeholder.com/80?text=Logo'}
                    alt={`${charity.name} logo`}
                    width={40}
                    height={40}
                    style={{ borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent)' }}
                  />
                  <h3 style={{ fontSize: '20px', fontWeight: 800 }}>{charity.name}</h3>
                </div>
                <p style={{ color: 'var(--muted)', fontSize: '14px', lineHeight: 1.5, marginBottom: '20px', flexGrow: 1 }}>
                  {charity.description}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--glass-border)', paddingTop: '16px' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--muted)' }}>Total Raised</div>
                    <div style={{ fontWeight: 800, color: 'var(--accent)' }}>${Number(charity.total_raised ?? 0).toLocaleString()}</div>
                  </div>
                  <Link href={`/charities/${charity.id}`} className="btn-secondary" style={{ padding: '8px 16px', fontSize: '14px' }}>
                    View Profile
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
