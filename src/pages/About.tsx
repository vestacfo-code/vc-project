import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import Header from '@/components/shared/Header';
import Footer from '@/components/shared/Footer';
import teamCollaboration from '@/assets/team-collaboration.jpg';

const About = () => {
  useEffect(() => {
    document.title = 'Leadership - Finlo AI | Meet Our Executive Team';
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Meet the leadership team at Finlo AI. Our executive leadership and team members are dedicated to helping SMBs grow with AI-powered financial insights.');
    }
  }, []);

  const executiveLeadership = [
    { 
      name: "Isaiah Sidi", 
      role: "Chief Executive Officer", 
      email: "isaiah@finlo.ai",
      image: "/lovable-uploads/isaiah-medium.png" 
    },
    { 
      name: "Evelyn Jimenez", 
      role: "Chief Financial Officer", 
      email: "evelyn@finlo.ai",
      image: "/lovable-uploads/evelyn-zoomed.png" 
    },
    { 
      name: "Irene Qu", 
      role: "Chief People Officer", 
      email: "irene@finlo.ai",
      image: "/lovable-uploads/irene-qu-zoomed.png" 
    },
    { 
      name: "Eric Rodriguez", 
      role: "Vice President of Product", 
      email: "eric@finlo.ai",
      image: "/lovable-uploads/4273048a-e27c-4b30-8f4c-8f7f97aba3ff.png" 
    },
    { 
      name: "Alice Jiang", 
      role: "Vice President of Growth", 
      email: "alice@finlo.ai",
      image: "/lovable-uploads/alice-jiang-final.png" 
    }
  ];

  const team = [
    { 
      name: "Isabella Wen", 
      role: "Director of Marketing", 
      email: "isabella@finlo.ai",
      image: "/lovable-uploads/isabella-wen.png" 
    },
    { 
      name: "Leo Chen", 
      role: "Director of Strategic Development", 
      email: "leo@finlo.ai",
      image: "/lovable-uploads/leo-chen-zoomed.png" 
    },
    { 
      name: "Emily Lourng", 
      role: "Business Development Associate", 
      email: "emily@finlo.ai",
      image: "/lovable-uploads/placeholder-avatar.png" 
    },
    { 
      name: "TBD", 
      role: "AI Engineer", 
      email: "ai@finlo.ai",
      image: "/lovable-uploads/placeholder-avatar.png" 
    },
    { 
      name: "Jack Zhang", 
      role: "Web Developer", 
      email: "jack@finlo.ai",
      image: "/lovable-uploads/jack-final.png" 
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f5f3ff] via-[#e8e4ff] to-[#ddd6ff] flex flex-col relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-300/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-blue-300/25 rounded-full blur-3xl pointer-events-none" />
      
      <Header />
      
      <div className="relative z-10 flex-1">
        {/* Hero Section */}
        <section className="pt-8 sm:pt-16 pb-8 md:pb-12">
          <div className="container mx-auto px-4 md:px-6 max-w-6xl">
            <div className="text-center mb-8 md:mb-12 animate-fade-in">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 tracking-tight">
                Governance
              </h1>
            </div>
          </div>
        </section>

        {/* Executive Leadership Team */}
        <section className="py-8 md:py-16">
          <div className="container mx-auto px-4 md:px-6 max-w-7xl">
            <div className="mb-6 md:mb-8 text-center">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                Executive Leadership
              </h2>
            </div>
            <div className="max-w-5xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12 mb-8 md:mb-12">
                {executiveLeadership.slice(0, 3).map((member, index) => (
                  <div key={index} className="text-center group animate-fade-in" style={{animationDelay: `${index * 0.1}s`}}>
                    <Avatar className="w-32 h-32 md:w-40 md:h-40 mx-auto mb-4 md:mb-6 ring-4 ring-white/50 group-hover:ring-purple-300/50 transition-all duration-300 group-hover:scale-105">
                      <AvatarImage src={member.image} alt={member.name} className="object-cover" />
                      <AvatarFallback className="bg-white/50 text-purple-600 text-xl md:text-2xl">{member.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <h3 className="font-bold text-gray-900 text-lg md:text-xl mb-1 md:mb-2">{member.name}</h3>
                    <p className="text-base md:text-lg text-gray-600 font-medium">{member.role}</p>
                  </div>
                ))}
              </div>
              <div className="flex justify-center gap-8 md:gap-12 flex-wrap">
                {executiveLeadership.slice(3).map((member, index) => (
                  <div key={index + 3} className="text-center group animate-fade-in w-full md:w-auto" style={{animationDelay: `${(index + 3) * 0.1}s`}}>
                    <Avatar className="w-32 h-32 md:w-40 md:h-40 mx-auto mb-4 md:mb-6 ring-4 ring-white/50 group-hover:ring-purple-300/50 transition-all duration-300 group-hover:scale-105">
                      <AvatarImage src={member.image} alt={member.name} className="object-cover" />
                      <AvatarFallback className="bg-white/50 text-purple-600 text-xl md:text-2xl">{member.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <h3 className="font-bold text-gray-900 text-lg md:text-xl mb-1 md:mb-2">{member.name}</h3>
                    <p className="text-base md:text-lg text-gray-600 font-medium">{member.role}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-8 md:py-16">
          <div className="container mx-auto px-4 md:px-6 max-w-7xl">
            <div className="mb-6 md:mb-8 text-center">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                Team
              </h2>
            </div>
            <div className="max-w-5xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12 mb-8 md:mb-12">
                {team.slice(0, 3).map((member, index) => (
                  <div key={index} className="text-center group animate-fade-in" style={{animationDelay: `${index * 0.1}s`}}>
                    <Avatar className="w-32 h-32 md:w-40 md:h-40 mx-auto mb-4 md:mb-6 ring-4 ring-white/50 group-hover:ring-gray-400/30 transition-all duration-300 group-hover:scale-105">
                      <AvatarImage src={member.image} alt={member.name} className="object-cover" />
                      <AvatarFallback className="bg-white/50 text-gray-600 text-xl md:text-2xl">{member.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <h3 className="font-bold text-gray-900 text-lg md:text-xl mb-1 md:mb-2">{member.name}</h3>
                    <p className="text-base md:text-lg text-gray-600 font-medium">{member.role}</p>
                  </div>
                ))}
              </div>
              <div className="flex justify-center gap-8 md:gap-12 flex-wrap">
                {team.slice(3).map((member, index) => (
                  <div key={index + 3} className="text-center group animate-fade-in w-full md:w-auto" style={{animationDelay: `${(index + 3) * 0.1}s`}}>
                    <Avatar className="w-32 h-32 md:w-40 md:h-40 mx-auto mb-4 md:mb-6 ring-4 ring-white/50 group-hover:ring-gray-400/30 transition-all duration-300 group-hover:scale-105">
                      <AvatarImage src={member.image} alt={member.name} className="object-cover" />
                      <AvatarFallback className="bg-white/50 text-gray-600 text-xl md:text-2xl">{member.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <h3 className="font-bold text-gray-900 text-lg md:text-xl mb-1 md:mb-2">{member.name}</h3>
                    <p className="text-base md:text-lg text-gray-600 font-medium">{member.role}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Careers Banner */}
        <section className="py-16 md:py-24 pb-20">
          <div className="container mx-auto px-4 md:px-6 max-w-5xl">
            <div className="animate-fade-in bg-white/70 backdrop-blur-md border border-white/30 rounded-2xl overflow-hidden shadow-lg">
              <div className="grid md:grid-cols-2 gap-0">
                <div className="relative h-64 md:h-auto">
                  <img src={teamCollaboration} alt="Team collaboration at Finlo" className="w-full h-full object-cover" />
                </div>
                <div className="p-8 md:p-12 flex flex-col justify-center text-center md:text-left">
                  <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">
                    Join Our Growing Team
                  </h2>
                  <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                    Help us transform how businesses understand their finances. We are looking for passionate individuals who want to make a real impact.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                    <Link to="/careers" className="w-full sm:w-auto">
                      <Button size="lg" className="w-full sm:w-auto bg-gray-900 text-white hover:bg-gray-800 border-none text-base px-8 py-5 rounded-xl font-medium shadow-sm transition-all duration-300 hover:scale-105">
                        View Open Positions
                        <ArrowRight className="ml-2 w-4 h-4" />
                      </Button>
                    </Link>
                    <a href="mailto:support@joinfinlo.ai" className="w-full sm:w-auto">
                      <Button size="lg" variant="outline" className="w-full sm:w-auto bg-white/50 border-white/30 text-gray-700 hover:bg-white/70 text-base px-8 py-5 rounded-xl font-medium transition-all duration-300">
                        Contact Us
                      </Button>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
};

export default About;