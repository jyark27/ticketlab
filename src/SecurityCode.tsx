import {useState} from 'react';
const CHARS='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export function makeCode(){return Array.from(crypto.getRandomValues(new Uint32Array(6)),v=>CHARS[v%CHARS.length]).join('');}
export default function SecurityCode({onVerify,onError}:{onVerify:()=>void;onError?:()=>void}){
 const [code,setCode]=useState(makeCode),[input,setInput]=useState(''),[error,setError]=useState(false),[plain,setPlain]=useState(false);
 function refresh(){setCode(makeCode());setInput('');}
 return <form className="security-form" onSubmit={e=>{e.preventDefault();if(input.trim().toUpperCase()===code){setError(false);refresh();onVerify();}else{setError(true);onError?.();refresh();}}}>
 <div className="captcha"><svg viewBox="0 0 300 88" role="img" aria-label="연습용 보안문자 이미지. 읽기 어려우면 텍스트 보기를 선택하세요."><rect width="300" height="88" fill="#f2f3ef"/>{Array.from({length:9},(_,i)=><path key={i} d={'M0 '+(i*11)+' Q150 '+((code.charCodeAt(i%6)*3)%88)+' 300 '+(88-i*9)} stroke="#bcc6b9" fill="none"/>)}{code.split('').map((c,i)=><text key={i} x={29+i*44} y={57+(c.charCodeAt(0)%9-4)} transform={'rotate('+(c.charCodeAt(0)%29-14)+' '+(29+i*44)+' 44)'} fontFamily="Georgia,serif" fontWeight="bold" fontStyle={i%2?'italic':'normal'} fontSize="38" fill={i%2?'#334c3b':'#555b67'}>{c}</text>)}</svg></div>
 <div className="inline between"><button type="button" className="text-button" onClick={refresh}>새 문자</button><button type="button" className="text-button" onClick={()=>setPlain(!plain)} aria-pressed={plain}>텍스트 {plain?'숨기기':'보기'}</button></div>{plain&&<output className="plain-code">{code}</output>}
 <label htmlFor="security-input">위의 문자 6자리를 입력하세요</label><input id="security-input" autoFocus autoComplete="off" autoCapitalize="characters" spellCheck={false} maxLength={6} value={input} onChange={e=>setInput(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,''))} placeholder="영문 · 숫자" aria-describedby="code-help"/>
 <p id="code-help" className={error?'error':'muted'} role={error?'alert':undefined}>{error?'입력한 문자가 다릅니다. 새 문자를 입력하세요.':'영문 대소문자는 구분하지 않습니다.'}</p><button className="primary full" disabled={input.length!==6}>입력 완료</button></form>;
}
