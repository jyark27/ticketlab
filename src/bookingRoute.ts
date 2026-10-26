import {getPlatform} from './platforms';
import {baseballVenues,concertVenues,type VenueId} from './venues';
import type {Scenario} from './simulator';

// Baseball has its own route. A concert URL can never select a baseball venue.
export function bookingRoute(name:string,query:URLSearchParams){
 const baseball=name==='baseball';
 const platform=getPlatform(baseball?(query.get('provider')==='ticketlink'?'ticketlink':'nol'):name);
 if(!platform)return undefined;
 const venues=baseball?baseballVenues:concertVenues;
 const venue:VenueId=venues.find(v=>v.id===query.get('venue'))?.id??(baseball?'jamsil':'goyang');
 const scenario:Scenario=baseball?(query.get('scenario')==='regular'?'regular':'postseason'):'opening';
 return {platform,venue,scenario};
}
