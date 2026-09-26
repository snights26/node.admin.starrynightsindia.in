import React, { useEffect, useState } from "react";
import "./Career.css";
import { apiBaseUrl } from "../../Utils/api";

export default function Career() {

useEffect(()=>{
window.scrollTo(0,0);
},[]);


/* FORM STATE */

  const [formData,setFormData]=useState({
name:"",
email:"",
phone:"",
position:"",
about:"",
  resume:null
  });
  const [isSubmitting, setIsSubmitting] = useState(false);


/* INPUT CHANGE */

const handleChange=(e)=>{
const {name,value,files}=e.target;

if(files){
setFormData({...formData,[name]:files[0]});
}else{
setFormData({...formData,[name]:value});
}
};


/* FORM SUBMIT */

const handleSubmit=async(e)=>{
e.preventDefault();
if (isSubmitting) return;

const data=new FormData();

data.append("name",formData.name);
data.append("email",formData.email);
data.append("phone",formData.phone);
data.append("position",formData.position);
data.append("about",formData.about);
data.append("resume",formData.resume);

try{

setIsSubmitting(true);

const response = await fetch(`${apiBaseUrl}/career-apply`,{
method:"POST",
body:data
});

if (!response.ok) {
const payload = await response.json().catch(() => null);
throw new Error(payload?.message || "Unable to submit your application. Please try again.");
}

alert("Application Submitted Successfully");

/* FORM RESET */

setFormData({
name:"",
email:"",
phone:"",
position:"",
about:"",
resume:null
});

e.target.reset();

}catch(err){

console.error(err);
alert(err.message || "Error submitting application");

} finally {

setIsSubmitting(false);

}

};

return(

<div className="career-page">

{/* HERO */}

<section className="career-hero">

<img
  src="/Starry Nights Holidays.png"
  alt="Starry Nights Holidays"
  className="career-bg-logo"
/>

<img
  src="/Starry Nights Holidays.png"
  alt="Starry Nights Holidays"
  className="career-logo"
/>

<h1>Careers at Starry Nights Holidays</h1>

<p>
At Starry Nights Holidays we believe that travel is more than simply visiting destinations.
It is about creating meaningful experiences, discovering cultures and building unforgettable
memories for travelers across the world.
</p>

<p>
We are constantly looking for passionate individuals who are curious about the world,
excited about tourism and motivated to build a long-term career in the travel industry.
If you believe travel has the power to change lives, you might be the perfect fit for our team.
</p>

</section>


{/* COMPANY JOURNEY */}

<section className="career-section">

<h2>Our Journey</h2>

<p>
Starry Nights Holidays began its journey in 2017 with a simple idea — bringing people
closer to nature through trekking and outdoor adventures. What started as a small
community organizing weekend treks soon evolved into a full-fledged travel company.
</p>

<p>
Over the years we expanded our services beyond adventure trips to include domestic
holiday packages, international tours, honeymoon trips, corporate travel planning
and customized travel experiences.
</p>

<p>
Today the company is growing into a modern travel brand focused on providing
personalized travel planning, safe adventure tourism and unforgettable
holiday experiences across India and around the world.
</p>

</section>


{/* WHAT WE DO */}

<section className="career-section career-highlight">

<h2>What We Do</h2>

<p>
Starry Nights Holidays operates as a full-service travel company offering a wide range
of tourism services designed for modern travelers. Our goal is to make travel planning
simple, exciting and completely stress-free for our clients.
</p>

<ul className="career-list">

<li>
<strong>Domestic Holiday Packages</strong> – We design carefully curated travel
packages across India including Kashmir, Himachal Pradesh, Ladakh,
Kerala, Rajasthan and North East India.
</li>

<li>
<strong>International Tours</strong> – Our team creates memorable international
holiday packages to destinations like Dubai, Thailand, Singapore,
Bali, Maldives and Europe.
</li>

<li>
<strong>Luxury Honeymoon Experiences</strong> – We specialize in romantic
honeymoon travel including luxury resorts, private tours and
customized couple experiences.
</li>

<li>
<strong>Adventure Travel</strong> – Trekking expeditions, camping trips,
mountain adventures and outdoor exploration programs
for travelers who love adventure.
</li>

<li>
<strong>Corporate Travel & MICE</strong> – We organize corporate offsites,
incentive tours, conferences and exhibitions for companies.
</li>

<li>
<strong>Educational Tours</strong> – Safe and structured student tours
for schools and colleges across India.
</li>

</ul>

</section>



{/* DEPARTMENTS */}

<section className="career-section">

<h2>Departments & Career Roles</h2>

<p>
Our organization operates through multiple specialized departments.
Each department plays a crucial role in delivering smooth travel
experiences for our customers. Below are some of the most important
career roles within our company.
</p>


<div className="career-grid">


<div className="career-card">

<h3>Travel Sales Executive</h3>

<p>
Travel sales executives are the first point of contact for travelers.
They interact with potential customers, understand travel requirements,
recommend destinations and convert inquiries into confirmed bookings.
</p>

<p>
This role requires strong communication skills, destination knowledge
and the ability to design attractive travel packages for families,
couples and group travelers.
</p>

</div>


<div className="career-card">

<h3>Tour Operations Executive</h3>

<p>
Operations professionals manage the backend logistics of every trip.
They coordinate hotel bookings, transport arrangements, permits,
tour guides and activity scheduling.
</p>

<p>
The operations team ensures that every itinerary runs smoothly
from departure to return.
</p>

</div>


<div className="career-card">

<h3>International Tour Escort</h3>

<p>
Tour escorts accompany group departures and manage the entire journey.
They assist travelers during the trip, coordinate with local partners
and ensure that the itinerary is followed properly.
</p>

<p>
This role requires leadership, travel experience and strong
problem solving abilities.
</p>

</div>


<div className="career-card">

<h3>Travel Consultant</h3>

<p>
Travel consultants specialize in designing customized travel plans
based on customer preferences. They research destinations,
suggest hotels and create personalized itineraries.
</p>

<p>
This role requires deep destination knowledge and an understanding
of traveler behavior.
</p>

</div>


<div className="career-card">

<h3>Digital Marketing Executive</h3>

<p>
The digital marketing team is responsible for growing the brand
through social media campaigns, SEO, content marketing
and digital advertising.
</p>

<p>
Their work helps attract travelers and build brand visibility online.
</p>

</div>


<div className="career-card">

<h3>Customer Support Executive</h3>

<p>
Customer support professionals help travelers before, during
and after their trips. They handle inquiries, solve travel issues
and ensure a smooth customer experience.
</p>

<p>
Their role is essential in maintaining trust and satisfaction
among travelers.
</p>

</div>


</div>

</section>



{/* WHY WORK */}

<section className="career-section career-highlight">

<h2>Why Work With Us</h2>

<ul className="career-list">

<li>
<strong>Work in a Fast Growing Industry</strong> – Tourism is one of the
largest and fastest growing industries globally. Working in travel
opens doors to diverse career opportunities across destinations,
airlines, hotels and travel companies.
</li>

<li>
<strong>Exposure to Global Destinations</strong> – Our team regularly
works with international destinations and tourism partners,
giving employees valuable exposure to global travel markets.
</li>

<li>
<strong>Creative and Dynamic Work Culture</strong> – The travel industry
is not a routine desk job. It involves creativity, planning,
problem solving and continuous interaction with travelers.
</li>

<li>
<strong>Opportunities to Explore the World</strong> – Employees
often get opportunities to travel for research, tour management
or destination familiarization programs.
</li>

<li>
<strong>Long Term Career Growth</strong> – With experience employees
can grow into senior roles such as travel planners, destination
specialists, tour managers and operations heads.
</li>

<li>
<strong>Real World Experience</strong> – Working in travel gives
practical knowledge about destinations, cultures, hospitality
and international tourism operations.
</li>

</ul>

</section>


<section className="career-section">

<h2>Life at Starry Nights</h2>

<p>
At Starry Nights Holidays we believe that a company grows when its
people grow. Our team culture is built around curiosity, exploration
and collaboration. Every team member is encouraged to bring ideas,
innovate travel experiences and contribute to building unforgettable
journeys for our travelers.
</p>

<p>
The work environment is dynamic and filled with people who genuinely
love travel. Discussions about destinations, cultures and new travel
trends are part of everyday conversations in our office.
</p>

<p>
From planning exciting itineraries to managing international tours,
every day presents new challenges and opportunities to learn.
Our team members gain exposure to global tourism trends,
destination research and real-world travel operations.
</p>

</section>

<section className="career-section career-highlight">

<h2>Employee Benefits</h2>

<ul className="career-list">

<li>
<strong>Travel Opportunities</strong> – Team members get opportunities
to explore destinations through familiarization trips, tour
escorting opportunities and travel research assignments.
</li>

<li>
<strong>Industry Exposure</strong> – Employees gain real experience
working with hotels, airlines, destination management companies
and international travel partners.
</li>

<li>
<strong>Career Growth</strong> – The tourism industry offers
multiple career paths including operations, destination
specialization, tour leadership and travel management.
</li>

<li>
<strong>Skill Development</strong> – Employees learn practical
skills such as itinerary planning, negotiation with suppliers,
customer communication and travel problem solving.
</li>

<li>
<strong>Dynamic Work Environment</strong> – Every day is different
in the travel industry. New destinations, new clients and new
challenges make the work exciting and rewarding.
</li>

</ul>

</section>


{/* FAQ */}

<section className="career-section">

<h2>Career FAQs</h2>

<div className="faq">

<h3>How can I start a career in the tourism industry?</h3>

<p>
Many professionals start their journey in tourism through roles
such as travel consultant, sales executive or tour coordinator.
With experience they grow into senior roles such as tour manager,
destination specialist or operations manager.
</p>

</div>

<div className="faq">

<h3>Do travel jobs require prior travel experience?</h3>

<p>
While travel experience is helpful, it is not always required.
The most important qualities are communication skills,
destination knowledge and a passion for travel.
</p>

</div>

<div className="faq">

<h3>Can I work as a freelance tour leader?</h3>

<p>
Yes. We often collaborate with freelance tour leaders
and travel experts for group departures and special tours.
</p>

</div>

<div className="faq">

<h3>Is tourism a long term career?</h3>

<p>
Yes. Tourism is one of the fastest growing global industries
with opportunities in travel companies, airlines, hospitality,
destination management and international tour operations.
</p>

</div>

</section>

<section className="career-apply">

<h2>Start Your Career at Starry Nights Holidays</h2>

<p>
If you are passionate about travel and want to build a career
in tourism, we would love to hear from you.
Submit your application below and our recruitment team
will contact shortlisted candidates.
</p>

<form className="career-form" onSubmit={handleSubmit}>

<input
type="text"
name="name"
placeholder="Full Name"
required
onChange={handleChange}
/>

<input
type="email"
name="email"
placeholder="Email Address"
required
onChange={handleChange}
/>

<input
type="tel"
name="phone"
placeholder="Phone Number"
required
onChange={handleChange}
/>

<input
type="text"
name="position"
placeholder="Position Applying For"
onChange={handleChange}
/>

<input
type="file"
name="resume"
accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
required
onChange={handleChange}
/>

<textarea
name="about"
placeholder="Tell us about yourself"
onChange={handleChange}
/>

<button type="submit" disabled={isSubmitting} aria-busy={isSubmitting}>
{isSubmitting ? "Submitting application…" : "Submit Application"}
</button>

</form>

</section>

</div>

);
}
