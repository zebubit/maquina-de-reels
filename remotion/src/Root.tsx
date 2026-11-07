import React from 'react';
import {Composition} from 'remotion';
import {Reels, FPS, type Props} from './Reels';
import exemplo from './exemplo-props.json';

export const Root: React.FC = () => (
	<Composition
		id="Reels"
		component={Reels}
		fps={FPS}
		width={1080}
		height={1920}
		durationInFrames={FPS * 10}
		defaultProps={exemplo as unknown as Props}
		calculateMetadata={({props}) => ({durationInFrames: Math.ceil((props.timeline.fim + 1.2) * FPS)})}
	/>
);
