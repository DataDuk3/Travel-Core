import React from 'react'
import Navbar from './navbar'

function About() {
  return (  
  <div className="body_container d-flex flex-column">
    <Navbar />
    <div className=" flex-column d-flex justify-content-center align-items-center">
      <div className="about">
        <h1 className='mb-3'>Welcome to Travel Core!</h1>
        <p>
          A space made for travelers who love to share their journeys. 
          Whether it’s a weekend getaway, a cross-country road trip, or an overseas adventure, 
          this is where your stories find a home. Write about the places you’ve been, add your 
          own reflections, and keep your memories safe online. Our goal is to build a community 
          where every journey—big or small—can inspire others to explore the world. Start writing, 
          relive your travels, and let your experiences spark someone else’s next adventure. 🌍
        </p>
      </div>
    </div>  
  </div>
  
  )
}

export default About