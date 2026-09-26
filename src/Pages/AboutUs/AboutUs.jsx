import "./AboutUs.css";
import { Link } from "react-router-dom";
import { useEffect } from "react";

export default function AboutUs() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="about-page">

      {/* TEAM IMAGE */}
<section className="team-banner">
  <img src="/TEAM-STARRY-NIGHTS.jpg" alt="Starry Nights Team" />
</section>

      {/* HERO */}
<section className="about-hero">
  <h1>STARRY NIGHTS INDIA - India's Leading Travel Company</h1>

  <q>
    STARRY NIGHTS INDIA is a trusted experiential travel company specializing in domestic and international tour packages, luxury honeymoon trips, corporate travel, group tours, and adventure tourism. We design personalized, safe, and premium travel experiences that go beyond destinations - turning every journey into unforgettable memories.
  </q>
</section>


      {/* COMPANY STORY */}
      <section className="about-section story-section">
  <h2>Our Journey Began With A Dream - The Story of STARRY NIGHTS INDIA</h2>

  <q>
    STARRY NIGHTS INDIA was founded in September 2017 with a bold vision - to redefine the way India 
    experiences travel. While many travel agencies focused only on selling fixed tour packages and 
    discount-based deals, we believed travel should be emotional, immersive, and transformational. 
    Our mission from day one was clear: create personalized travel experiences that feel premium, safe, 
    and unforgettable.
  </q>

  <q>
    The journey began as a passionate trekking and adventure travel community in Maharashtra. 
    Weekend treks, night camping experiences, mountain expeditions, and raw nature escapes formed 
    the foundation of what STARRY NIGHTS INDIA stands for today - adventure tourism with safety, 
    professionalism, and emotional connection. Under open skies and around campfires, strangers 
    became friends, and a travel community was born.
  </q>

  <q>
    As trust grew, so did our vision. What started with trekking expeditions expanded into 
    structured domestic tour packages across India, student educational tours, corporate travel programs, 
    group departures, customized honeymoon packages, family vacation planning, and curated 
    international holiday packages. Every new service was added with one goal - deliver seamless 
    travel management backed by expert planning and verified partners.
  </q>

  <q>
    STARRY NIGHTS INDIA gradually evolved into a premium experiential travel company offering 
    complete travel solutions including hotel bookings, transport arrangements, visa assistance, 
    luxury honeymoon planning, corporate offsite coordination, and personalized international tours. 
    Our approach has always been detail-oriented, transparent, and traveler-first.
  </q>

  <q>
    Today, STARRY NIGHTS INDIA is recognized as a trusted travel brand serving families, couples, 
    students, corporates, and adventure enthusiasts. We do not simply sell travel packages - 
    we design meaningful journeys that inspire growth, strengthen relationships, and create 
    lifelong memories. Each itinerary carries our signature blend of strategic planning, 
    premium hospitality, safety standards, and emotional storytelling.
  </q>

  <q>
    Our journey continues with one powerful promise - every traveler who chooses STARRY NIGHTS INDIA 
    returns home not just with photographs, but with stories, friendships, personal growth, and 
    unforgettable experiences. We aim to build a global travel community rooted in responsible tourism, 
    cultural respect, sustainable travel practices, and world-class service excellence.
  </q>

  <q>
    STARRY NIGHTS INDIA is more than a travel company - it is a movement of explorers who believe 
    travel should transform perspectives, create purpose, and connect people beyond borders. 
    And this journey is only just beginning.
  </q>

</section>


  {/* TIMELINE */}
<section className="about-section timeline-section">
  <h2>Our Growth Timeline - The Journey of STARRY NIGHTS INDIA</h2>

  <div className="timeline">

    <div className="timeline-item">
      <span className="timeline-year">2017 - The Beginning</span>
      <p>
        STARRY NIGHTS INDIA was founded with a passion for trekking expeditions, adventure trips, 
        camping experiences, and weekend getaways across Maharashtra. What started as small-group 
        adventure tours quickly grew into a trusted travel community focused on safe trekking, 
        curated itineraries, and experiential travel.
      </p>
    </div>

    <div className="timeline-item">
      <span className="timeline-year">2019 - Expansion into Domestic Tourism</span>
      <p>
        With increasing traveler trust, STARRY NIGHTS INDIA expanded into full-scale domestic tour 
        packages across India, including family vacation packages, student educational tours, 
        corporate outings, group tours, and customized holiday planning. Our operations scaled with 
        structured travel management, professional tour leaders, and improved logistics systems.
      </p>
    </div>

    <div className="timeline-item">
      <span className="timeline-year">2021 - Government Recognition & Credibility</span>
      <p>
        A major milestone came when STARRY NIGHTS INDIA received official recognition from 
        Maharashtra Tourism and was onboarded on the MahaBooking portal. This strengthened our 
        credibility as a registered and trusted travel company committed to safety, transparency, 
        and quality tourism services.
      </p>
    </div>

    <div className="timeline-item">
      <span className="timeline-year">2024 - Entering International & Luxury Travel</span>
      <p>
        In 2024, STARRY NIGHTS INDIA entered the international tourism market, launching curated 
        international holiday packages, luxury honeymoon packages, premium couple getaways, and 
        customized global travel experiences. We expanded into visa assistance, international hotel 
        bookings, luxury travel planning, and premium group departures.
      </p>
    </div>

    <div className="timeline-item">
      <span className="timeline-year">2026 & Beyond - Building a Global Travel Ecosystem</span>
      <p>
        Our future vision includes launching luxury resorts, transport services, adventure parks, 
        corporate travel solutions, destination wedding planning, and a global experiential travel 
        platform. STARRY NIGHTS INDIA aims to become a globally recognized premium travel brand 
        offering end-to-end domestic and international travel services for families, couples, 
        students, corporates, and luxury travelers worldwide.
      </p>
    </div>

  </div>
</section>

      {/* VISION & MISSION */}
     <section className="about-section vm-section">
  <h2>Our Vision & Mission - STARRY NIGHTS INDIA</h2>

  <div className="vm-grid">
    <div className="vm-card">
      <h3>🌍 Our Vision</h3>

      <p>
        At STARRY NIGHTS INDIA, our vision is to become India's most trusted, premium, and globally recognized 
        experiential travel company delivering world-class travel experiences across adventure tourism, luxury holidays, 
        honeymoon packages, group tours, corporate travel, destination weddings, wellness retreats, and customized international tour packages.
      </p>

      <p>
        We envision STARRY NIGHTS INDIA as a leading travel brand that transforms traditional tour packages into 
        personalized, immersive, and life-changing journeys. Our goal is to redefine the Indian travel industry by 
        offering curated domestic tour packages, international holiday packages, luxury travel planning, and safe 
        adventure trips designed around each traveler's dreams, budget, and lifestyle.
      </p>

      <p>
        Our long-term vision is to build a powerful global travel ecosystem where STARRY NIGHTS INDIA becomes 
        synonymous with premium travel services, safe group departures, customized honeymoon trips, corporate 
        offsite planning, student trips, family vacation packages, and experiential tourism solutions.
      </p>

      <p>
        We aim to set new benchmarks in safety standards, hospitality excellence, customer satisfaction, and 
        operational transparency in the travel and tourism industry. Through responsible tourism, sustainable 
        travel practices, eco-friendly tour planning, and ethical partnerships, STARRY NIGHTS INDIA strives 
        to protect nature, respect cultures, and empower local communities.
      </p>

      <p>
        Our vision is not just about selling travel packages - it is about building a legacy travel brand that 
        generations trust for unforgettable holidays, luxury experiences, adventure expeditions, and curated 
        global journeys.
      </p>
    </div>

    <div className="vm-card">
      <h3>🚀 Our Mission</h3>

      <p>
        The mission of STARRY NIGHTS INDIA is to deliver safe, affordable, customized, and unforgettable 
        travel experiences through expert itinerary planning, certified trek leaders, professional travel 
        consultants, and reliable global travel partners.
      </p>

      <p>
        We are committed to providing end-to-end travel solutions including hotel bookings, flight reservations, 
        visa assistance, transport arrangements, group tour management, honeymoon planning, corporate travel 
        coordination, and luxury holiday customization.
      </p>

      <p>
        Our mission focuses on creating personalized domestic and international tour packages that match 
        individual travel goals - whether it's an adventure trip, a romantic honeymoon, a family vacation, 
        a corporate retreat, a destination wedding, or a premium luxury holiday experience.
      </p>

      <p>
        STARRY NIGHTS INDIA prioritizes customer safety, transparent pricing, verified vendors, 
        24/7 travel support, and seamless on-ground coordination to ensure smooth travel execution 
        from inquiry to safe return.
      </p>

      <p>
        We are dedicated to innovation in experiential tourism, luxury travel services, curated 
        group departures, student tours, wellness retreats, and corporate event travel planning. 
        By leveraging technology, destination expertise, and storytelling-driven travel design, 
        we aim to create emotionally enriching travel experiences.
      </p>

      <p>
        Ultimately, our mission is to transform every journey into a lifelong memory and every traveler 
        into a brand ambassador of STARRY NIGHTS INDIA - a travel company built on trust, excellence, 
        innovation, and unforgettable holiday experiences.
      </p>
    </div>
  </div>
</section>


      {/* WHY US */}
    <section className="about-section about-highlight">
  <h2>Why Travelers Choose Starry Nights India</h2>

  <p>
    <strong>Starry Nights India</strong> is not just another travel company - we are a trusted name in 
    tourism management, known for delivering premium tour packages and customized holiday experiences 
    across India and international destinations. Our mission is to design thoughtfully planned journeys 
    that align perfectly with your travel goals, budget, and expectations.
  </p>

  <p>
    As a leading travel company, Starry Nights India specializes in domestic tours, international tours, 
    honeymoon packages, group tours, corporate trips, adventure tours, and trekking expeditions. Every 
    holiday package is carefully curated with detailed destination research, professional itinerary planning, 
    and seamless travel coordination to ensure a smooth and stress-free experience.
  </p>

  <p>
    Our team includes certified trek leaders, experienced travel consultants, professional tour planners, 
    and safety-trained trip coordinators who manage everything - from hotel bookings and transportation 
    arrangements to local guides and on-ground assistance. We focus on secure travel planning, verified 
    hotel partners, and reliable transport networks to maintain the highest standards of safety and comfort.
  </p>

  <p>
    At Starry Nights India, we believe in responsible tourism and transparent travel management. Whether 
    you are planning a family vacation, a romantic honeymoon trip, a student group tour, a corporate retreat, 
    or an adventure trekking tour, our customized tour packages are built to deliver exceptional value and 
    memorable experiences.
  </p>

  <p>
    Thousands of travelers choose Starry Nights India every year for reliable service, professional 
    execution, and well-managed travel experiences. Our growing community of happy travelers reflects 
    our commitment to quality, trust, and consistent excellence in the travel and tourism industry.
  </p>

  <p>
    When you travel with Starry Nights India, you don't just book a tour package - you partner with a 
    dedicated travel company that prioritizes safety, planning precision, and unforgettable journeys. 
    Your trip becomes our responsibility, and your satisfaction becomes our success.
  </p>
</section>

<section className="about-section story-section">
  <h2>Our Premium Travel Services - STARRY NIGHTS INDIA</h2>

  <q>
    STARRY NIGHTS INDIA is a leading travel company in India offering customized domestic and international tour packages, 
    luxury holidays, honeymoon trips, corporate travel solutions, group tours, adventure tourism, and complete travel management services. 
    As a trusted experiential travel brand, we design personalized travel experiences that combine comfort, safety, premium hospitality, 
    and seamless planning for families, couples, students, corporates, and global explorers.
  </q>

  <q>
    Our expert travel consultants carefully curate every itinerary to match your budget, preferences, and travel goals. 
    From hotel bookings and flight reservations to visa assistance, transport management, sightseeing tours, and 24/7 travel support, 
    STARRY NIGHTS INDIA provides end-to-end travel solutions across India and worldwide destinations.
  </q>

  <h3> Luxury Honeymoon Tour Packages</h3>
  <q>
    We specialize in romantic honeymoon packages and luxury couple getaways to destinations like Maldives, Bali, Thailand, Dubai, 
    Switzerland, Paris, Kashmir, Manali, Goa, and Kerala. Our honeymoon tours include premium resorts, private villa stays, 
    candlelight dinners, curated sightseeing, surprise decorations, and personalized romantic experiences designed for unforgettable memories.
  </q>

  <h3>👨‍👩‍👧 Family Holiday & Vacation Packages</h3>
  <q>
    Our family tour packages cover Rajasthan, Himachal Pradesh, Uttarakhand, Kerala, Andaman Islands, North East India, 
    Singapore, Dubai, and Europe. We provide family-friendly hotels, comfortable transport, guided sightseeing, 
    child-friendly activities, and safe travel arrangements to ensure stress-free vacations.
  </q>

  <h3>🌿 Jungle Safari & Wildlife Tourism</h3>
  <q>
    Experience thrilling wildlife safaris and eco-tourism adventures in Jim Corbett, Ranthambore, Gir National Park, 
    Bandhavgarh, Tadoba, Kaziranga, and African safari destinations. Our wildlife tours include jeep safaris, 
    nature walks, bird watching, forest stays, and wildlife photography expeditions guided by experts.
  </q>

  <h3>💍 Anniversary & Romantic Getaways</h3>
  <q>
    Celebrate anniversaries, birthdays, proposals, and special occasions with luxury romantic holidays in Udaipur, 
    Shimla, Ooty, Lonavala, Bali, Maldives, Santorini, and Dubai. We create curated romantic itineraries with 
    luxury stays, private experiences, and memorable surprises.
  </q>

  <h3>🏫 School, College & Educational Tours</h3>
  <q>
    STARRY NIGHTS INDIA organizes educational school tours, college trips, industrial visits, historical tours, 
    and student adventure camps across Delhi, Jaipur, Agra, Manali, Coorg, and international educational destinations. 
    Safety protocols, group management, and structured learning experiences are our top priorities.
  </q>

  <h3>🏢 Corporate Tours, MICE & Incentive Travel</h3>
  <q>
    Our corporate travel services include team outings, incentive tours, conferences, exhibitions, corporate retreats, 
    and MICE travel planning at premium destinations like Goa, Thailand, Dubai, Bali, and hill stations across India. 
    We professionally manage logistics, event coordination, hotel bookings, transport, and conference arrangements.
  </q>

  <h3>🏔 Adventure Tourism & Trekking Expeditions</h3>
  <q>
    We offer Himalayan treks, Ladakh bike trips, river rafting in Rishikesh, camping experiences, paragliding, 
    scuba diving in Andaman, desert safaris in Rajasthan, and international adventure tours in Nepal and beyond. 
    Our adventure travel packages are designed with certified trek leaders and strict safety standards.
  </q>

  <h3> Domestic & International Tour Packages</h3>
  <q>
    Explore India and global destinations with our customized domestic tour packages and international holiday packages. 
    Popular destinations include Kashmir, Kerala, Rajasthan, North East India, Dubai, Thailand, Singapore, Bali, Europe, Australia, and more. 
    We provide complete travel planning including itinerary customization, visa assistance, flights, hotels, sightseeing tours, and travel insurance.
  </q>

  <h3>🚗 Complete Travel Support & Services</h3>
  <q>
    STARRY NIGHTS INDIA offers complete travel solutions including hotel bookings, flight tickets, car rentals, 
    luxury transport, tour guides, travel insurance, and 24/7 on-trip assistance. Our verified vendors and trusted 
    partners ensure safe, comfortable, and premium travel experiences.
  </q>

  <q>
    Whether you are looking for budget travel packages, luxury holidays, private customized tours, group departures, 
    honeymoon trips, corporate travel management, or international vacations, STARRY NIGHTS INDIA is your trusted 
    travel partner delivering excellence, reliability, and unforgettable journeys.
  </q>
</section>

      {/* CTA */}
      <section className="about-cta">
        <h2>Start Your Journey With Starry Nights</h2>
        <p>
          From weekend escapes to luxury international holidays - we design every journey with passion.  
          Let us turn your travel dreams into unforgettable experiences.
        </p>

        <Link to="/">       
          <button>Explore Packages</button>
        </Link>
      </section>

    </div>
  );
}

