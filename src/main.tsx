import { render } from 'preact';
import { App } from './App';
import './styles.css';

// Block pinch-zoom gestures on iOS Safari (double-tap zoom is handled by touch-action in CSS).
document.addEventListener('gesturestart', (e) => e.preventDefault());

render(<App />, document.getElementById('app')!);
