window.marketChecks={calls:[],saved:false,read:false};
const testPage=new URLSearchParams(location.search).get('page')||'discover';
const role=testPage==='provider'?'PROVIDER':testPage==='admin'?'ADMIN':'USER';
const fixtureRequest={id:'request1',status:'COMPLETED',provider_service_id:'s1',provider_name:'Demo Plumber s1',locality:'Demo test area',price:450,created_at:'2026-10-04T10:00:00Z'};
const fixtureAction={id:'action1',tool_name:'service.create_request',fingerprint:'a'.repeat(64),expires_at:'2026-10-04T15:00:00Z',arguments:{request:{provider_service_id:'s1',latitude:17.44,longitude:78.35,locality:'Demo test area'},quote:{provider:'Demo Plumber s1',service:'Tap repair',price:450,price_model:'fixed',starts_at:'2026-10-04T10:00:00Z',ends_at:'2026-10-04T14:00:00Z',notice:'Internal marketplace request.'}}};
const match=id=>({provider_service_id:id,provider_id:'p'+id,name:'Demo Plumber '+id,service:'Tap repair',category:'plumbing',demo:true,latitude:17.44,longitude:78.35,service_radius_km:10,distance_km:1,price:id==='s1'?450:350,price_model:'fixed',rating:4.5,review_count:2,available:true,slots:[{id:'slot1',starts_at:'2026-10-04T10:00:00Z',ends_at:'2026-10-04T14:00:00Z'}],saved:marketChecks.saved,score:.8,components:{distance:.8},preference_matches:[],service_area_match:true,reasons:['Within your radius and budget.']});
window.fetch=async(url,options={})=>{
 const path=new URL(url,location.href).pathname;marketChecks.calls.push({path,method:options.method||'GET',csrf:options.headers?.['X-CSRF-Token'],body:options.body});let data;
 if(path==='/auth/me')data={id:'browser-test-user',role,email:'ui@example.test',csrf:'csrf-test'};
 else if(path==='/auth/profile')data={name:'UI test',latitude:17.44,longitude:78.35,budget_max:500,preferences:[]};
 else if(path==='/marketplace/categories')data={categories:[{id:'plumbing',name:'Plumbing'}]};
 else if(path==='/marketplace/history/searches')data={searches:[]};
 else if(path==='/marketplace/search')data={recommendations:[match('s1'),match('s2')],missing_required_fields:[]};
 else if(path==='/marketplace/compare')data={comparison:[{...match('s1'),eligible:true},{...match('s2'),eligible:true}]};
 else if(path.startsWith('/marketplace/saved/')){marketChecks.saved=options.method!=='DELETE';data={saved:marketChecks.saved};}
 else if(path==='/marketplace/notifications')data={notifications:[{id:'n1',read:marketChecks.read,event_type:'ACCEPTED',text:'Accepted',created_at:'2026-10-04T10:00:00Z'}]};
 else if(path==='/marketplace/notifications/n1/read'){marketChecks.read=true;data={read:true};}
 else if(path==='/marketplace/actions')data={actions:[fixtureAction]};
 else if(path==='/marketplace/history/requests')data={requests:[fixtureRequest]};
 else if(path==='/marketplace/requests/request1')data={request:fixtureRequest,events:[{new_status:'REQUESTED',created_at:fixtureRequest.created_at},{new_status:'COMPLETED',created_at:fixtureRequest.created_at}]};
 else if(path==='/marketplace/reviews')data={review_id:'review1',rating:4.5,review_count:2};
 else if(path==='/marketplace/feedback')data={feedback_id:'feedback1'};
 else if(path==='/marketplace/history/conversations')data={conversations:[{id:'conversation1',title:'Who fixed my tap?'}]};
 else if(path==='/marketplace/history/audit')data={events:[{created_at:fixtureRequest.created_at,event_type:'request.status_changed',resource_id:'request1'}]};
 else if(path==='/marketplace/saved')data={saved:[{provider_service_id:'s1',name:'Demo Plumber s1',active:true}]};
 else if(path==='/provider/profiles')data={providers:[{id:'p1',business_name:'Demo Plumbing',description:'Demo provider',verified:true,profile:{contact_email:'provider@example.test'},location:{latitude:17.44,longitude:78.35,locality:'Demo area'},service_area:{radius_km:10},offerings:[{id:'s1',service_id:'plumbing-standard',description:'Tap repair',pricing:{amount:450,model:'fixed'},active:true,tags:['highly rated'],slots:[]}]}]};
 else if(path==='/provider/catalogue')data={services:[{id:'plumbing-standard',name:'Tap repair'}]};
 else if(path==='/provider/requests')data={requests:[{...fixtureRequest,status:'REQUESTED'}]};
 else if(path==='/provider/reviews')data={reviews:[{rating:5,text:'Good demo service'}]};
 else if(path==='/provider/requests/request1/transition')data={request_id:'request1',status:JSON.parse(options.body).status};
 else if(path==='/admin/analytics')data={search_count:12,request_conversion:.5,completion_rate:.5,request_status_counts:{COMPLETED:1}};
 else if(path==='/admin/providers')data={providers:[{id:'p1',business_name:'Demo Plumbing',active:true,verified:false}]};
 else if(path==='/admin/catalogue')data={categories:[{id:'plumbing',name:'Plumbing',active:true}],services:[{id:'plumbing-standard',category_id:'plumbing',name:'Tap repair',description:'Repair',active:true}]};
 else if(path==='/admin/reviews')data={reviews:[{id:'review1',rating:5,text:'Good demo service',visible:true}]};
 else if(path==='/admin/requests')data={requests:[fixtureRequest]};
 else if(path==='/admin/audit')data={events:[{created_at:fixtureRequest.created_at,event_type:'request.status_changed',resource_id:'request1'}]};
 else if(path==='/marketplace/selected')data={recorded:true};
 else if(path.startsWith('/marketplace/services/'))data={provider:{business_name:'Demo Plumber s1',description:'<img src=x onerror=alert(1)>',average_rating:4.5,review_count:2},profile:{contact_email:'provider@example.test'},location:{locality:'Demo area'},service_area:{radius_km:10},pricing:{amount:450,model:'fixed'},reviews:[{rating:5,text:'Good demo service'}],services:[{id:'s1',name:'Tap repair',price:450,price_model:'fixed'}],slots:[{id:'slot1',starts_at:'2026-10-04T10:00:00Z',ends_at:'2026-10-04T14:00:00Z'}],saved:marketChecks.saved};
 else if(path==='/marketplace/actions/request'){const body=JSON.parse(options.body);data={action:{id:'action1',fingerprint:'a'.repeat(64),expires_at:'2026-10-04T15:00:00Z',arguments:{request:body,quote:{provider:'Demo Plumber s1',service:'Tap repair',price:450,price_model:'fixed',starts_at:'2026-10-04T10:00:00Z',ends_at:'2026-10-04T14:00:00Z',notice:'Internal marketplace request.'}}}};}
 else if(path==='/marketplace/actions/action1/confirm')data={verified:true,request_id:'request1',status:'REQUESTED',notice:'Request creation verified.'};
 else throw Error('Unexpected marketplace fixture '+path);
 return Response.json(data);
};
