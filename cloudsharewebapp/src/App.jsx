import {BrowserRouter, Route, Routes} from "react-router-dom";
import Landing from "./pages/Landing.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Upload from "./pages/Upload.jsx";
import MyFiles from "./pages/MyFiles.jsx";
import Subscription from "./pages/Subscription.jsx";
import Transactions from "./pages/Transactions.jsx";
import {RedirectToSignIn, SignedIn, SignedOut} from "@clerk/clerk-react";
import {Toaster} from "react-hot-toast";
import {UserCreditsProvider} from "./context/UserCreditsContext.jsx";
import PublicFileView from "./pages/PublicFileView.jsx";

const App = () => {
    return (
        <UserCreditsProvider>
            <BrowserRouter>
                <Toaster />
                <Routes>
                    <Route path="/" element={<Landing />} />
                    <Route path="/dashboard" element={
                        <>
                            <SignedIn><Dashboard /></SignedIn>
                            <SignedOut><RedirectToSignIn /></SignedOut>
                        </>
                    } />
                    <Route path="/upload" element={
                        <>
                            <SignedIn><Upload /></SignedIn>
                            <SignedOut><RedirectToSignIn /></SignedOut>
                        </>
                    } />
                    <Route path="/my-files" element={
                        <>
                            <SignedIn><MyFiles /></SignedIn>
                            <SignedOut><RedirectToSignIn /></SignedOut>
                        </>
                    } />
                    <Route path="/subscriptions" element={
                        <>
                            <SignedIn><Subscription /></SignedIn>
                            <SignedOut><RedirectToSignIn /></SignedOut>
                        </>
                    } />
                    <Route path="/transactions" element={
                        <>
                            <SignedIn><Transactions /></SignedIn>
                            <SignedOut><RedirectToSignIn /></SignedOut>
                        </>
                    } />
                    <Route path="file/:fileId" element={
                        <>
                            <PublicFileView />
                        </>
                    }/>
                    <Route path="/*" element={<RedirectToSignIn />} />
                </Routes>
            </BrowserRouter>
        </UserCreditsProvider>
    )
}

export default App;