export function wilson(wins,n,z=1.959963984540054) {
  if(!n)return null;
  if(!Number.isInteger(wins)||!Number.isInteger(n)||wins<0||wins>n||n<1)throw new Error('Invalid binomial counts');
  const p=wins/n,z2=z*z,den=1+z2/n;
  const center=(p+z2/(2*n))/den;
  const half=z*Math.sqrt(p*(1-p)/n+z2/(4*n*n))/den;
  return {low:Math.max(0,center-half),high:Math.min(1,center+half)};
}
function distribution(values) {
  if(!values.length)return {mean:null,median:null,p90:null,min:null,max:null};
  const sorted=[...values].sort((a,b)=>a-b);
  return {mean:values.reduce((a,b)=>a+b,0)/values.length,
    median:sorted[Math.floor((sorted.length-1)/2)],p90:sorted[Math.ceil(sorted.length*0.9)-1],
    min:sorted[0],max:sorted.at(-1)};
}
export function summarize(trials) {
  const wins=trials.filter(t=>t.won),losses=trials.filter(t=>!t.won),n=trials.length;
  const turns=Object.fromEntries(Array.from({length:7},(_,i)=>[i+1,0]));turns.loss=losses.length;
  for(const t of wins)turns[t.attempts]++;
  return {games:n,wins:wins.length,winRate:n?wins.length/n:null,win95:wilson(wins.length,n),
    meanAttemptsWins:wins.length?wins.reduce((a,t)=>a+t.attempts,0)/wins.length:null,
    meanAttemptsAll:n?trials.reduce((a,t)=>a+t.attempts,0)/n:null,distribution:turns,
    residualAll:distribution(trials.map(t=>t.residual)),residualLoss:distribution(losses.map(t=>t.residual)),
    residualByTurn:Array.from({length:7},(_,i)=>({turn:i+1,...distribution(trials.flatMap(t=>t.history?.[i]?[t.history[i].candidates]:[]))})),
    lossExamples:losses.slice(0,3).map(t=>({trial:t.trial,secret:t.secret,residual:t.residual,history:t.history}))};
}
