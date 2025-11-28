import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";

import App from "./App";
import Home from "./pages/Home";
import Explore from "./pages/Explore";
import ExploreResult from "./pages/ExploreResult";
import QuestionChat from "./pages/QuestionChat";
import Questions from "./pages/Questions";
import StyleSelector from "./pages/StyleSelector";
import VoiceAssistant from "./pages/VoiceAssistant";
import PregnancyDatePicker from "./pages/PregnancyDatePicker";

const router = createBrowserRouter([
	{
		path: "/",
		element: <App />,
	},
	{
		path: "/home",
		element: <Home />,
	},
	{
		path: "/explore",
		element: <Explore />,
	},
	{
		path: "/explore/result",
		element: <ExploreResult />,
	},
	{
		path: "/questions/chat",
		element: <QuestionChat />,
	},
	{
		path: "/questions",
		element: <Questions />,
	},
	{
		path: "/styleselector",
		element: <StyleSelector />,
	},
	{
		path: "/voice-assistant",
		element: <VoiceAssistant />,
	},
	{
		path: "/pregnancy-date",
		element: <PregnancyDatePicker />,
	},
]);

ReactDOM.createRoot(document.getElementById("root")).render(
	<React.StrictMode>
		<RouterProvider router={router} />
	</React.StrictMode>
);
