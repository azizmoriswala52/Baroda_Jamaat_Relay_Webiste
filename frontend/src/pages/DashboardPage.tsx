import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { PlayCircle, Radio, RefreshCw } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { apiClient } from '../api/apiClient';

const DashboardPage = () => {
  const navigate = useNavigate();

  const { data: streams, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['streams'],
    queryFn: () => apiClient('/streams'),
    refetchInterval: 5000,
  });

  const userStr = sessionStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const isAdmin = user?.role === 'ADMIN';

  const handleJoinSession = (relayId: string) => {
    // Navigate directly to relay page.
    navigate('/relay');
  };

  return (
    <>
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <h3 className="text-2xl font-bold text-brand-accent tracking-wide">Available Relays</h3>
          <button 
            onClick={() => refetch()}
            className="p-2 hover:bg-slate-200 rounded-lg transition-colors flex items-center text-sm font-medium text-slate-600"
            title="Refresh Relays"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin text-brand-accent' : ''}`} />
            Refresh
          </button>
        </div>
        <div className="h-0.5 w-full bg-slate-200 mt-2"></div>
      </div>

      {isLoading || (isFetching && (!streams || streams.length === 0)) ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-accent"></div>
        </div>
      ) : !streams || streams.length === 0 ? (
            <div className="p-16 text-center text-slate-500">
              <Radio className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-sm">There are no relays currently active.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {streams.map((relay: any, idx: number) => (
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  key={relay._id} 
                  className={`group flex flex-col bg-white rounded-xl shadow-sm border ${relay.isLive ? 'border-brand-accent/50 hover:shadow-md cursor-pointer' : 'border-slate-200 hover:border-slate-300 cursor-pointer'} overflow-hidden transition-all duration-300`}
                  onClick={() => {
                    if (relay.isLive) {
                      handleJoinSession(relay._id);
                    } else {
                      toast.error('The live stream is currently offline.', { icon: '📡' });
                    }
                  }}
                >
                  {/* Image Area - video aspect ratio */}
                  <div 
                    className={`relative aspect-video flex flex-col items-center justify-center p-6 pt-10 ${!relay.thumbnail && relay.isLive ? 'bg-gradient-to-b from-brand-accent/10 to-brand-accent/5' : 'bg-slate-100'}`}
                    style={relay.thumbnail ? { backgroundImage: `url(${relay.thumbnail})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
                  >
                    {/* Top Decorative Strip */}
                    <div className="absolute top-0 left-0 w-full z-20" style={{ background: "url('https://medias.its52.com/AM48/YaAli_YaHussain.png') repeat-x", backgroundSize: '72px', height: '24px' }}></div>
                    
                    {!relay.thumbnail && (
                      <>
                        <div className="absolute inset-0 bg-[url('https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Bismillah_Calligraphy.svg/1024px-Bismillah_Calligraphy.svg.png')] opacity-5 bg-center bg-contain bg-no-repeat m-10"></div>
                        
                        <h3 className="relative z-10 text-2xl text-center font-bold text-brand-accent leading-snug drop-shadow-sm mb-4">
                          {relay.title}
                        </h3>
                        <p className="relative z-10 text-xs font-semibold text-slate-600 uppercase tracking-widest text-center">
                          {relay.speaker}
                        </p>
                      </>
                    )}

                    {relay.isLive ? (
                      <div className="absolute bottom-4 left-4 bg-red-600 text-white px-2.5 py-1 rounded text-[10px] font-bold tracking-wider flex items-center shadow-md">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse mr-1.5"></span> LIVE
                      </div>
                    ) : (
                      <div className="absolute bottom-4 left-4 bg-slate-800/70 text-white px-2.5 py-1 rounded text-[10px] font-bold tracking-wider">
                        OFFLINE
                      </div>
                    )}
                    
                    {/* Hover Overlay */}
                    {relay.isLive && (
                      <div className="absolute inset-0 bg-brand-accent/0 group-hover:bg-brand-accent/10 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <div className="bg-white text-brand-accent rounded-full p-4 shadow-lg transform scale-90 group-hover:scale-100 transition-all">
                          <PlayCircle className="w-8 h-8" />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Bottom Text Area */}
                  <div className="p-5 bg-white border-t border-slate-100 flex flex-col justify-center">
                    <h4 className="text-xl sm:text-2xl font-bold text-slate-800 truncate mb-1">{relay.title}</h4>
                    <p className="text-xs text-slate-500 font-medium">Waaz karnar: {relay.speaker}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
    </>
  );
};

export default DashboardPage;
