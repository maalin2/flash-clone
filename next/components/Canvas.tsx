// client-side rendered
"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import NextImage from 'next/image';

export default function Canvas() {
	// update canvas without rerender -> useref
	const canvasRef = useRef<HTMLCanvasElement>(null);

	const [isDrawing, setIsDrawing] = useState(false);
	const [frames, setFrames] = useState<(string | null)[]>([null]);
	const [currentFrame, setCurrentFrame] = useState<number>(0);
	const [isPlaying, setIsPlaying] = useState(false);
	const intervalRef = useRef<NodeJS.Timeout | null>(null);
	const [frameRate, setFrameRate] = useState<number>(24);
	const [brushSize, setBrushSize] = useState<number>(5);
	const [erasing, setErasing] = useState(false);
	// update frame using current data on canvas
	const updateFrame = useCallback(
		() => {
			const canvas = canvasRef.current;
			if (!canvas) return;
			// read the curr frame
			const imageData = canvas.toDataURL();

			setFrames((prevFrames) => {
				const newFrames = [...prevFrames]; 
				newFrames[currentFrame] = imageData;
				return newFrames;
			});
		}, [currentFrame]
	);

	// load frame from base64
	const loadFrame = useCallback(
		(index: number) => {
			const canvas = canvasRef.current;
			if (!canvas) return;

			const ctx = canvas.getContext("2d");
			if (!ctx) return;

			const drawImage = (src: string, opacity: number) => {
				const image = new Image();
				image.src = src;
				image.onload = () => {
					ctx.globalAlpha = opacity;
					ctx.drawImage(image, 0, 0);
					ctx.globalAlpha = 1.0;
				}
			}

			if (frames[index]) {
				drawImage(frames[index], 1.0);
			}

//			// onion skin
			if (isPlaying == false) {
				if (frames[index - 1]) {
					drawImage(frames[index - 1] ?? "", 0.08);
				}
				
				if (frames[index + 1]) {
					drawImage(frames[index + 1] ?? "", 0.08);
				}
			}

		}, [isPlaying, frames]
);

useEffect(() => {
	// canvas context allows us to manipulate
	const canvas = canvasRef.current;
	if (!canvas) return;
	// the canvas
	const ctx = canvas.getContext("2d");
	if (!ctx) return;

	ctx.fillStyle = "white";
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	// modify context to get a more pixel-y look
	ctx.lineWidth = brushSize;
	ctx.lineCap = "square";
	ctx.lineJoin = "miter";
	
	loadFrame(currentFrame);

	// handlers to draw 
	const startDrawing = (e: MouseEvent) => {
		const ctx = canvasRef.current.getContext('2d');
		ctx.beginPath();
		ctx.moveTo(e.offsetX, e.offsetY);
		setIsDrawing(true);
	};

	const draw = (e: MouseEvent) => {
		if (!isDrawing) return;
		// if erasing we dont want to erase on top of onion skin
		ctx.globalCompositeOperation = erasing ? "destination-out" : "source-over";
		ctx.lineTo(e.offsetX, e.offsetY);
		ctx.stroke();	
	};

	const stopDrawing = () => {
		setIsDrawing(false);
		ctx.closePath();
		ctx.globalCompositeOperation = "source-over";
		updateFrame();
	};

	// apply handlers
	canvas.addEventListener("mousedown", startDrawing);
	canvas.addEventListener("mousemove", draw);
	canvas.addEventListener("mouseup", stopDrawing);

	// when we return erase handlers
	return () => {
		canvas.removeEventListener("mousedown", startDrawing);
		canvas.removeEventListener("mousemove", draw);
		canvas.removeEventListener("mouseup", stopDrawing);
	};
}, [brushSize, erasing, isDrawing, currentFrame, loadFrame, updateFrame]);


const newFrame = () => {
	const canvas = canvasRef.current;
	if (!canvas) return;
	const ctx = canvas.getContext("2d");
	if (!ctx) return;

	ctx.clearRect(0, 0, canvas.width, canvas.height);
	const blankFrame = canvas.toDataURL();

	setFrames((prevFrames) => {
		const newFrames = [...prevFrames];
		newFrames.splice(currentFrame + 1, 0, blankFrame);
		return newFrames;
	});

	setCurrentFrame(currentFrame + 1);
};

const copyFrame = () => {
	const canvas = canvasRef.current;
	if (!canvas) return;
	const ctx = canvas.getContext("2d");
	if (!ctx) return;

	const copiedFrame = canvas.toDataURL();

	setFrames((prevFrames) => {
		const newFrames = [...prevFrames];
		newFrames.splice(currentFrame + 1, 0, copiedFrame);
		return newFrames;
	});

	setCurrentFrame(currentFrame + 1);
};

const deleteFrame = () => {
	if (frames.length == 1) return;
	
	setFrames((prevFrames) => {
		const newFrames = prevFrames.filter((_, index) => index != currentFrame);	
		return newFrames;	
	});


	setCurrentFrame(Math.max(currentFrame - 1, 0));
};

const selectFrame = (i: number) => {
	setCurrentFrame(i);
	loadFrame(i);
};

// use loadFrame and setCurrentFrame handlers
const goToPreviousFrame = () => {
	if (currentFrame > 0) {
		setCurrentFrame((prev) => prev - 1);
		loadFrame(currentFrame - 1);
	}
}

// pretty similar
const goToNextFrame = () => {
	if (currentFrame + 1 < frames.length) {
		setCurrentFrame((prev) => prev + 1);
		loadFrame(currentFrame + 1);
	}
}


const playFrames = () => {
	if (isPlaying) {
		if (intervalRef.current) {
			clearInterval(intervalRef.current);
			intervalRef.current = null;
		}
		setIsPlaying(false);
	} 
	else {
		let i = 0;
		const N = frames.length;
		intervalRef.current = setInterval(() => {
			loadFrame(i % N);
			setCurrentFrame(i % N);
			i++;
		}, 1000 / frameRate); // 24 frames per second

		setIsPlaying(true);
	}
};

// use the frameRate slider
const handleFrameRate = (value: number) => {
	setFrameRate(value);
	console.log(`frame rate ${frameRate}`);
};

const handleBrushSize = (value: number) => {
	setBrushSize(value);
	console.log(`brush size ${brushSize}`);
};

const handleErasing = () => {
	setErasing(!erasing);
	console.log(erasing ? "erasing" : "drawing");
};

// return div with canvas and a few buttons and inputs
return (
	<div className="flex flex-col justify-center items-center h-screen bg-gray-100">
		<canvas ref={canvasRef} width={800} height={500} className="border bg-white"  />

		<div className="mt-4">
			<label htmlFor="frameRateSelector">frameRate: {frameRate}</label>
			<input id="frameRateSelector" className="block mb-2" type="range" min={12} max={60} value={frameRate} onChange={(e) => handleFrameRate(parseInt(e.target.value))}/>

			<label htmlFor="brushSizer">brushSize: {brushSize}</label>
			<input id="brushSizer" className="block mb-2" type="range" min={0.1} max={20} value={brushSize} onChange={(e) => handleBrushSize(parseFloat(e.target.value))}/>

			<button className={`${erasing ? "bg-red-500" : "bg-green-500"} text-white px-4 py-3 rounded`} onClick={handleErasing}>{erasing ? "erasing" : "drawing"}</button>

			<button className="bg-green-500 text-white px-4 py-3 rounded" onClick={newFrame}>new frame</button>
			<button className="bg-green-500 text-white px-4 py-3 rounded" onClick={copyFrame}>copy frame</button>
			<button className="bg-red-500 text-white px-4 py-3 rounded" onClick={deleteFrame}>delete frame</button>

			<button className="bg-blue-500 text-white px-4 py-3 rounded" onClick={goToPreviousFrame}>prev</button>
			<button className="bg-blue-500 text-white px-4 py-3 rounded" onClick={goToNextFrame}>next</button>
			<button className="bg-blue-500 text-white px-4 py-3 rounded" onClick={playFrames}>{isPlaying ? "stop" : "play" }</button>
		</div>

		<div className="w-full mt-4 px-4">
			<div className="bg-gray-300 p-2 rounded-lg">
				<p>Viewing frame {1 + currentFrame}</p>
				<div className="flex space-x-2 overflow-x-auto p-2">
					{frames.map((frame, index) => (
						<div
						key={index}
						className={`flex-shrink-0 justify-center w-20 h-16 border-2 ${
							index === currentFrame ? "border-blue-500" : "border-gray-400"
						} cursor-pointer`}
						onClick={() => selectFrame(index)}
						>
							{frame ? (
								<NextImage width={80} height={64} alt="frame image" src={frame} />
							) : (
							<div className="flex justify-center items-center w-full h-full">empty</div>
							)}
						</div>
					))}
				</div>
			</div>
		</div>
	</div>
);
}
