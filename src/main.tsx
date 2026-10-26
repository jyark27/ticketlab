import React from 'react';
import ReactDOM from 'react-dom/client';
import Root from './Root';
import './styles.css';
import './studio.css';
import './palettes.css';
import './interaction.css';
import './baseball.css';
import './readability.css';
class ErrorBoundary extends React.Component<React.PropsWithChildren,{failed:boolean}>{
 state={failed:false};
 static getDerivedStateFromError(){return {failed:true};}
 render(){return this.state.failed?<main className="center-panel"><h1>화면을 다시 열어주세요.</h1><p>현재 연습을 불러오지 못했습니다. 저장된 연습 기록은 유지됩니다.</p><button onClick={()=>{location.hash='';location.reload();}}>처음으로 돌아가기</button></main>:this.props.children;}
}
ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><ErrorBoundary><Root/></ErrorBoundary></React.StrictMode>);
