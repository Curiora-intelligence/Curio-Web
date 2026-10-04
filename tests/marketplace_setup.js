window.marketChecks={calls:[],saved:false};
const match=id=>({provider_service_id:id,provider_id:'p'+id,name:'Demo Plumber '+id,service:'Tap repair',category:'plumbing',demo:true,latitude:17.44,longitude:78.35,service_radius_km:10,distance_km:1,price:id==='s1'?450:350,price_model:'fixed',rating:4.5,review_count:2,available:true,slots:[{id:'slot1',starts_at:'2026-10-04T10:00:00Z',ends_at:'2026-10-04T14:00:00Z'}],saved:marketChecks.saved,score:.8,components:{distance:.8},preference_matches:[],service_area_match:true,reasons:['Within your radius and budget.']});
window.fetch=async(url,options={})=>{
 const path=new URL(url,location.href).pathname;marketChecks.calls.push({path,method:options.method||'GET',csrf:options.headers?.['X-CSRF-Token'],body:options.body});let data;
 if(path==='/auth/me')data={id:'browser-test-user',role:'USER',email:'ui@example.test',csrf:'csrf-test'};
 else if(path==='/auth/profile')data={name:'UI test',latitude:17.44,longitude:78.35,budget_max:500,preferences:[]};
 else if(path==='/marketplace/categories')data={categories:[{id:'plumbing',name:'Plumbing'}]};
 else if(path==='/marketplace/history/searches')data={searches:[]};
 else if(path==='/marketplace/search')data={recommendations:[match('s1'),match('s2')],missing_required_fields:[]};
 else if(path==='/marketplace/compare')data={comparison:[{...match('s1'),eligible:true},{...match('s2'),eligible:true}]};
 else if(path.startsWith('/marketplace/saved/')){marketChecks.saved=options.method!=='DELETE';data={saved:marketChecks.saved};}
 else if(path==='/marketplace/notifications')data={notifications:[{id:'n1',read:false,text:'Accepted'}]};
 else if(path==='/marketplace/selected')data={recorded:true};
 else if(path.startsWith('/marketplace/services/'))data={provider:{business_name:'Demo Plumber s1',description:'<img src=x onerror=alert(1)>',average_rating:4.5,review_count:2},profile:{contact_email:'provider@example.test'},location:{locality:'Demo area'},service_area:{radius_km:10},pricing:{amount:450,model:'fixed'},reviews:[{rating:5,text:'Good demo service'}],services:[{id:'s1',name:'Tap repair',price:450,price_model:'fixed'}],slots:[{id:'slot1',starts_at:'2026-10-04T10:00:00Z',ends_at:'2026-10-04T14:00:00Z'}],saved:marketChecks.saved};
 else if(path==='/marketplace/actions/request'){const body=JSON.parse(options.body);data={action:{id:'action1',fingerprint:'a'.repeat(64),expires_at:'2026-10-04T15:00:00Z',arguments:{request:body,quote:{provider:'Demo Plumber s1',service:'Tap repair',price:450,price_model:'fixed',starts_at:'2026-10-04T10:00:00Z',ends_at:'2026-10-04T14:00:00Z',notice:'Internal marketplace request.'}}}};}
 else if(path==='/marketplace/actions/action1/confirm')data={verified:true,request_id:'request1',status:'REQUESTED',notice:'Request creation verified.'};
 else throw Error('Unexpected marketplace fixture '+path);
 return Response.json(data);
};
