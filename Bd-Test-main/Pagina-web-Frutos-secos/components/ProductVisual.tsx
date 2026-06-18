import React from 'react';

interface ProductVisualProps {
  slug: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const ProductVisual: React.FC<ProductVisualProps> = ({ slug, className = '', size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-24 h-24',
    lg: 'w-48 h-48',
    xl: 'w-64 h-64',
  };

  // Harmonious, elegant background colors for SVGs
  const getBgColor = (s: string) => {
    switch (s) {
      case 'almonds': return 'bg-[#F2E8DF] text-[#8E5A36]';
      case 'nuts': return 'bg-[#EFEBE4] text-[#7A5A3D]';
      case 'cashews': return 'bg-[#F9F3EA] text-[#A88260]';
      case 'pumpkin-seeds': return 'bg-[#E5ECE9] text-[#3D6A54]';
      case 'oat-flour': return 'bg-[#F6F6EE] text-[#C4B79B]';
      case 'coconut-oil': return 'bg-[#F0F5F6] text-[#2F5D62]';
      case 'honey': return 'bg-[#FFF9E6] text-[#D49B00]';
      case 'peanut-butter': return 'bg-[#FAF0E6] text-[#A0522D]';
      case 'matcha': return 'bg-[#ECF5EE] text-[#2D6A4F]';
      case 'banana-chips': return 'bg-[#FFFDF0] text-[#D8B4F8]';
      default: return 'bg-[#F4F4F4] text-[#2D6A4F]';
    }
  };

  const renderSvg = (s: string) => {
    switch (s) {
      case 'almonds':
        return (
          <svg viewBox="0 0 100 100" className="w-2/3 h-2/3 fill-current">
            {/* Elegant Almond Vectors */}
            <path d="M50,15 C68,45 75,70 50,85 C25,70 32,45 50,15 Z" opacity="0.9" />
            <path d="M54,25 C68,48 70,68 53,80 C36,68 38,48 52,25" fill="#FFFFFF" opacity="0.2" />
            <circle cx="50" cy="55" r="3" opacity="0.3" />
            <path d="M48,35 C42,45 40,55 45,65" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.4" />
            <path d="M55,42 C58,50 56,60 52,70" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.4" />
          </svg>
        );
      case 'nuts':
        return (
          <svg viewBox="0 0 100 100" className="w-2/3 h-2/3 fill-current">
            {/* Elegant Walnut (Nuez Mariposa) */}
            <path d="M50,15 C72,15 80,35 80,55 C80,75 68,85 50,85 C32,85 20,75 20,55 C20,35 28,15 50,15 Z" fill="none" stroke="currentColor" strokeWidth="3" />
            <path d="M50,15 C50,15 55,30 50,55 C45,70 50,85 50,85" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="2,2" />
            {/* Left Brain lobe */}
            <path d="M45,25 C30,22 28,45 35,50 C28,52 26,72 45,75 C42,65 40,58 45,50 C40,42 42,32 45,25 Z" opacity="0.85" />
            {/* Right Brain lobe */}
            <path d="M55,25 C70,22 72,45 65,50 C72,52 74,72 55,75 C58,65 60,58 55,50 C60,42 58,32 55,25 Z" opacity="0.85" />
            <circle cx="36" cy="38" r="4" fill="#FFFFFF" opacity="0.2" />
            <circle cx="64" cy="38" r="4" fill="#FFFFFF" opacity="0.2" />
          </svg>
        );
      case 'cashews':
        return (
          <svg viewBox="0 0 100 100" className="w-2/3 h-2/3 fill-current">
            {/* Elegant Cashew (Castaña de Cajú) */}
            <path d="M30,35 C40,20 65,22 75,38 C85,55 75,75 55,75 C42,75 35,62 48,55 C60,48 65,40 52,38 C40,36 32,45 30,35 Z" opacity="0.9" />
            <path d="M55,30 C65,32 68,42 62,50" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.3" />
          </svg>
        );
      case 'pumpkin-seeds':
        return (
          <svg viewBox="0 0 100 100" className="w-2/3 h-2/3 fill-current">
            {/* Elegant Pumpkin Seeds */}
            <path d="M50,15 C62,35 62,65 50,85 C38,65 38,35 50,15 Z" opacity="0.9" />
            <path d="M48,25 C55,40 55,60 48,75" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.3" />
            <path d="M25,40 C35,50 35,70 25,80 C15,70 15,50 25,40 Z" opacity="0.5" />
            <path d="M75,40 C85,50 85,70 75,80 C65,70 65,50 75,40 Z" opacity="0.5" />
          </svg>
        );
      case 'oat-flour':
        return (
          <svg viewBox="0 0 100 100" className="w-2/3 h-2/3 fill-current">
            {/* Paper Bag of Flour */}
            <path d="M25,25 L75,25 L80,85 L20,85 Z" opacity="0.9" />
            <path d="M25,25 L50,15 L75,25 Z" fill="none" stroke="currentColor" strokeWidth="2.5" />
            {/* Label */}
            <rect x="35" y="40" width="30" height="30" rx="3" fill="#FFFFFF" />
            <path d="M40,50 L60,50 M40,60 L55,60" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
            <path d="M45,30 L55,30" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
        );
      case 'coconut-oil':
        return (
          <svg viewBox="0 0 100 100" className="w-2/3 h-2/3 fill-current">
            {/* Glass Jar with Coconut icon */}
            <path d="M30,30 L70,30 C75,30 78,35 78,40 L78,80 C78,85 73,90 68,90 L32,90 C27,90 22,85 22,80 L22,40 C22,35 25,30 30,30 Z" opacity="0.85" />
            <rect x="26" y="15" width="48" height="15" rx="2" fill="currentColor" />
            {/* Coconut Shell drawing on jar */}
            <circle cx="50" cy="60" r="14" fill="#FFFFFF" opacity="0.9" />
            <path d="M50,49 A 11 11 0 0 0 39,60 A 11 11 0 0 0 50,71 Z" fill="currentColor" opacity="0.9" />
            <circle cx="47" cy="56" r="2" fill="#FFFFFF" />
            <circle cx="47" cy="64" r="2" fill="#FFFFFF" />
          </svg>
        );
      case 'honey':
        return (
          <svg viewBox="0 0 100 100" className="w-2/3 h-2/3 fill-current">
            {/* Hexagonal Honey Jar */}
            <path d="M30,25 H70 L80,48 L70,82 H30 L20,48 Z" opacity="0.9" />
            <rect x="35" y="10" width="30" height="15" rx="3" fill="currentColor" />
            {/* Honey Comb Hexagon */}
            <polygon points="50,45 58,50 58,60 50,65 42,60 42,50" fill="#FFFFFF" opacity="0.8" />
            <circle cx="50" cy="55" r="2" fill="currentColor" />
            {/* Drip */}
            <path d="M46,12 C46,12 50,4 50,0 C50,4 54,12 50,15 C46,12 46,12 46,12 Z" fill="#D49B00" transform="translate(0, 75)" />
          </svg>
        );
      case 'peanut-butter':
        return (
          <svg viewBox="0 0 100 100" className="w-2/3 h-2/3 fill-current">
            {/* Peanut Butter Jar */}
            <path d="M26,35 H74 C78,35 80,39 80,44 V80 C80,85 75,90 70,90 H30 C25,90 20,85 20,80 V44 C20,39 22,35 26,35 Z" opacity="0.9" />
            <rect x="24" y="20" width="52" height="15" rx="3" fill="currentColor" opacity="0.8" />
            {/* Label with Peanut illustration */}
            <rect x="30" y="48" width="40" height="30" rx="2" fill="#FFFFFF" />
            <path d="M45,55 C41,58 41,68 47,70 C52,68 53,60 48,58 C53,56 52,50 45,55 Z" fill="currentColor" opacity="0.7" />
          </svg>
        );
      case 'matcha':
        return (
          <svg viewBox="0 0 100 100" className="w-2/3 h-2/3 fill-current">
            {/* Traditional Matcha Tin and Whisk */}
            <path d="M25,25 H75 V85 C75,88 72,90 69,90 H31 C28,90 25,88 25,85 Z" opacity="0.9" />
            <path d="M22,15 H78 V25 H22 Z" fill="currentColor" opacity="0.8" />
            {/* Japanese Logo lines */}
            <rect x="44" y="40" width="12" height="36" rx="1" fill="#FFFFFF" />
            <path d="M50,46 V70 M47,52 H53 M47,62 H53" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        );
      case 'banana-chips':
        return (
          <svg viewBox="0 0 100 100" className="w-2/3 h-2/3 fill-current">
            {/* Crisp Dried Banana slices */}
            <circle cx="50" cy="50" r="30" opacity="0.9" />
            <circle cx="50" cy="50" r="24" fill="#FFFFFF" opacity="0.25" />
            {/* Seeds */}
            <circle cx="44" cy="46" r="2.5" fill="currentColor" opacity="0.5" />
            <circle cx="54" cy="44" r="2.5" fill="currentColor" opacity="0.5" />
            <circle cx="50" cy="56" r="2.5" fill="currentColor" opacity="0.5" />
            {/* Secondary chip */}
            <circle cx="28" cy="72" r="18" opacity="0.6" />
            <circle cx="28" cy="72" r="14" fill="#FFFFFF" opacity="0.25" />
          </svg>
        );
      default:
        // Generic elegant nut seed illustration
        return (
          <svg viewBox="0 0 100 100" className="w-2/3 h-2/3 fill-current">
            <path d="M50,15 C65,30 75,50 75,65 C75,80 63,85 50,85 C37,85 25,80 25,65 C25,50 35,30 50,15 Z" opacity="0.9" />
            <path d="M50,25 C58,35 65,50 55,75" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.3" />
          </svg>
        );
    }
  };

  // Check if it's a base64 encoded user-uploaded image
  const isBase64 = slug && slug.startsWith('data:image/');
  const isHttpUrl = slug && (slug.startsWith('http://') || slug.startsWith('https://') || slug.startsWith('/'));

  return (
    <div className={`relative flex items-center justify-center rounded-2xl overflow-hidden shadow-sm transition-all duration-300 ${sizeClasses[size]} ${isBase64 || isHttpUrl ? 'bg-[#F4F4F4]' : getBgColor(slug)} ${className}`}>
      {isBase64 || isHttpUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={slug}
          alt="Product Illustration"
          className="w-full h-full object-cover rounded-2xl"
          onError={(e) => {
            // Fallback to default SVG if image error occurs
            e.currentTarget.style.display = 'none';
            const parent = e.currentTarget.parentElement;
            if (parent) {
              parent.className += ' bg-[#F4F4F4] text-[#2D6A4F]';
              // Set a visual icon or tag
            }
          }}
        />
      ) : (
        renderSvg(slug)
      )}
    </div>
  );
};
