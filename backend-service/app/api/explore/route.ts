import { NextResponse } from 'next/server';

export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

// Fallback images in case Unsplash runs out of rate limit or returns empty
const FALLBACK_IMAGES: Record<string, string[]> = {
  treks: [
    'https://images.unsplash.com/photo-1544365558-35aa4afcf11f?w=600',
    'https://images.unsplash.com/photo-1622304910292-29fc3777dcc0?w=600',
    'https://images.unsplash.com/photo-1581793739226-ebc2b0c4ebcb?w=600',
    'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600'
  ],
  food: [
    'https://images.unsplash.com/photo-1589301760014-d929f39ce9b1?w=600',
    'https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?w=600',
    'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=600',
    'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600'
  ],
  vegFood: [
    'https://images.unsplash.com/photo-1626776876729-abdf8b2c4e32?w=600', // Dosa
    'https://images.unsplash.com/photo-1589301760014-d929f39ce9b1?w=600', // Samosa/Chaat
    'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600', // Thali
    'https://images.unsplash.com/photo-1555126634-ae23443a68d7?w=600'  // Sweets
  ],
  pilgrimage: [
    'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?w=600',
    'https://images.unsplash.com/photo-1601058269784-0a37b3552a4f?w=600',
    'https://images.unsplash.com/photo-1558500249-1e35a113bc94?w=600',
    'https://images.unsplash.com/photo-1514222134-b57cbb8ce073?w=600'
  ],
  cab: [
    'https://images.unsplash.com/photo-1534258936925-c58bed479fcb?w=600',
    'https://images.unsplash.com/photo-1566838332152-78d103714b14?w=600',
    'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=600'
  ],
  festivals: [
    'https://images.unsplash.com/photo-1618335025785-50269f826359?w=600',
    'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=600',
    'https://images.unsplash.com/photo-1533174000276-24dfbc83515d?w=600'
  ],
  local: [
    'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=600',
    'https://images.unsplash.com/photo-1571536802807-3cab30eb02ee?w=600',
    'https://images.unsplash.com/photo-1477587458883-47145ed94245?w=600'
  ],
  all: [
    'https://images.unsplash.com/photo-1544365558-35aa4afcf11f?w=600',
    'https://images.unsplash.com/photo-1589301760014-d929f39ce9b1?w=600',
    'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?w=600',
    'https://images.unsplash.com/photo-1618335025785-50269f826359?w=600'
  ]
};

function getRandomFallback(category: string) {
  const arr = FALLBACK_IMAGES[category] || FALLBACK_IMAGES['all'];
  return arr[Math.floor(Math.random() * arr.length)];
}

export async function GET(req: Request) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
  };

  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') || '';
    const category = searchParams.get('category') || 'all';

    const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
    const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;
    
    if (!GOOGLE_API_KEY) {
      return NextResponse.json({ error: 'Google Places API Key not configured' }, { status: 503, headers });
    }

    // Formulate a context-aware query based on the category
    let searchQuery = '';
    let unsplashQuery = '';
    const locationContext = q.trim() ? q : 'India';

    // Comprehensive list of holy/pilgrimage sites across India
    const isPilgrimageSite = [
      'temple', 'mandir', 'pilgrimage', 'ayodhya', 'mathura', 'haridwar', 'varanasi', 'kashi', 
      'kanchipuram', 'ujjain', 'dwarka', 'badrinath', 'puri', 'rameswaram', 'katra', 
      'vaishno devi', 'vrindavan', 'rishikesh', 'kedarnath', 'amritsar', 'prayagraj', 
      'allahabad', 'pushkar', 'tirupati', 'tirumala', 'madurai', 'srirangam', 'trichy', 
      'chidambaram', 'tanjore', 'thanjavur', 'sabarimala', 'guruvayur', 'somnath', 
      'prabhas patan', 'shirdi', 'nashik', 'palitana', 'bhubaneswar', 'konark', 
      'bodh gaya', 'gaya', 'deoghar', 'baidyanath dham', 'guwahati', 'kamakhya'
    ].some(keyword => locationContext.toLowerCase().includes(keyword));

    switch (category) {
      case 'treks':
        searchQuery = `popular treks and hiking trails in ${locationContext}`;
        unsplashQuery = `mountains hiking ${locationContext}`;
        break;
      case 'pilgrimage':
        searchQuery = `famous temples and pilgrimage sites in ${locationContext}`;
        unsplashQuery = `temple architecture ${locationContext}`;
        break;
      case 'festivals':
        searchQuery = `cultural festivals and event venues in ${locationContext}`;
        unsplashQuery = `festival crowd ${locationContext}`;
        break;
      case 'food':
        if (isPilgrimageSite) {
          searchQuery = `best pure vegetarian restaurants veg street food in ${locationContext}`;
          unsplashQuery = `vegetarian street food delicious ${locationContext}`;
        } else {
          searchQuery = `best restaurants street food markets in ${locationContext}`;
          unsplashQuery = `street food delicious ${locationContext}`;
        }
        break;
      case 'cab':
        searchQuery = `popular weekend getaways from ${locationContext}`;
        unsplashQuery = `road trip car landscape ${locationContext}`;
        break;
      case 'local':
        searchQuery = `top tourist attractions in ${locationContext}`;
        unsplashQuery = `city street travel ${locationContext}`;
        break;
      default:
        searchQuery = `popular places in ${locationContext}`;
        unsplashQuery = `beautiful landscape city ${locationContext}`;
    }

    // 1. Fetch Google Places
    const placesUrl = `https://places.googleapis.com/v1/places:searchText`;
    const placesResponse = await fetch(placesUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_API_KEY,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.rating'
      },
      body: JSON.stringify({
        textQuery: searchQuery,
        pageSize: 15
      })
    });
    
    const placesData = await placesResponse.json();

    if (!placesResponse.ok) {
      console.error('Google Places (New) API Error:', placesData);
      return NextResponse.json({ error: 'Failed to fetch places from New API' }, { status: 500, headers });
    }

    // 2. Fetch Unsplash Photos (Single batch call for efficiency)
    let unsplashPhotos: any[] = [];
    if (UNSPLASH_ACCESS_KEY) {
      try {
        const unsplashUrl = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(unsplashQuery)}&client_id=${UNSPLASH_ACCESS_KEY}&per_page=15&orientation=portrait`;
        const unsplashRes = await fetch(unsplashUrl);
        const unsplashJson = await unsplashRes.json();
        if (unsplashJson.results) {
          unsplashPhotos = unsplashJson.results;
        }
      } catch (err) {
        console.error('Unsplash fetch error:', err);
      }
    }

    // 3. Map Places with Unsplash Photos
    const results = (placesData.places || []).map((place: any, index: number) => {
      
      // Pull image from Unsplash array, or fallback if Unsplash didn't return enough photos
      // Ensure we use the pure veg fallback for pilgrimage sites in the food category
      let fallbackCategory = category;
      if (category === 'food' && isPilgrimageSite) {
        fallbackCategory = 'vegFood';
      }
      let imageUrl = getRandomFallback(fallbackCategory);
      if (unsplashPhotos[index] && unsplashPhotos[index].urls && unsplashPhotos[index].urls.regular) {
        imageUrl = unsplashPhotos[index].urls.regular;
      }

      const joined = Math.floor(Math.random() * 10) + 1;
      const total = joined + Math.floor(Math.random() * 10) + 1;

      return {
        id: place.id || `place_${index}`,
        type: 'image',
        category: category !== 'all' ? category : 'local',
        title: place.displayName?.text || 'Unknown Place',
        location: place.formattedAddress?.split(',')[0] || locationContext,
        image: imageUrl,
        groupSize: `${joined}/${total} Joined`,
        isHot: place.rating > 4.5 || Math.random() > 0.7, 
      };
    });

    return NextResponse.json({ results }, { headers });

  } catch (error: any) {
    console.error('Error in /api/explore:', error);
    return NextResponse.json({ error: error.message }, { status: 500, headers });
  }
}
