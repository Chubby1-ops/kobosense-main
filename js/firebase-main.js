const firebaseConfig = {
    apiKey: "AIzaSyB1c2Z-ctftvsQ1buZ7hFyTWMnPaXiP2qw",
    authDomain: "kobosense-95537.firebaseapp.com",
    projectId: "kobosense-95537",
    storageBucket: "kobosense-95537.firebasestorage.app",
    messagingSenderId: "392842074122",
    appId: "1:392842074122:web:92aa7a0ada09f19c6527f3"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();

let cloudUser = null;

const appLoading = document.getElementById("appLoading");
const authGate = document.getElementById("authGate");
const onboarding = document.getElementById("onboarding");
const studentApp = document.getElementById("app");
const authMsg = document.getElementById("authMsg");

const signUpBtn = document.getElementById("signUpBtn");
const loginBtn = document.getElementById("loginBtn");
const resetBtn = document.getElementById("resetBtn");

function hideEveryStage() {
    if (authGate) authGate.hidden = true;
    if (onboarding) onboarding.hidden = true;
    if (studentApp) studentApp.hidden = true;
}

function showLoading() {
    hideEveryStage();

    if (appLoading) {
        appLoading.hidden = false;
    }
}

function showAccountScreen(message = "") {
    if (appLoading) appLoading.hidden = true;
    if (onboarding) onboarding.hidden = true;
    if (studentApp) studentApp.hidden = true;

    if (authGate) {
        authGate.hidden = false;
    }

    if (authMsg && message) {
        authMsg.textContent = message;
    }
}

function showOnboarding(name = "") {
    if (appLoading) appLoading.hidden = true;
    if (authGate) authGate.hidden = true;
    if (studentApp) studentApp.hidden = true;

    if (onboarding) {
        onboarding.hidden = false;
    }

    const fullNameInput = document.getElementById("fullName");

    if (fullNameInput && name && !fullNameInput.value.trim()) {
        fullNameInput.value = name;
    }
}

function showStudentApp() {
    if (appLoading) appLoading.hidden = true;
    if (authGate) authGate.hidden = true;
    if (onboarding) onboarding.hidden = true;

    if (studentApp) {
        studentApp.hidden = false;
    }
}

function profileIsComplete() {
    const profile = state?.profile;

    if (!profile) {
        return false;
    }

    return Boolean(
        String(profile.name || "").trim() &&
        String(profile.level || "").trim() &&
        String(profile.university || "").trim() &&
        Number(profile.allowance) > 0
    );
}

/*
 * Hide Account, Onboarding and Dashboard immediately.
 * Only Loading is allowed to show while Firebase checks the session.
 */
showLoading();

window.KoboCloud = {
    async saveState(data) {
        if (!cloudUser) return;

        await db
            .collection("users")
            .doc(cloudUser.uid)
            .collection("private")
            .doc("state")
            .set(
                {
                    data,
                    updatedAt:
                        firebase.firestore.FieldValue.serverTimestamp()
                },
                { merge: true }
            );
    },

    async signOut() {
        await auth.signOut();
        location.reload();
    }
};

signUpBtn.addEventListener("click", async () => {
    try {
        authMsg.textContent = "Creating account...";

        const name = document
            .getElementById("authName")
            .value
            .trim();

        const email = document
            .getElementById("authEmail")
            .value
            .trim();

        const password =
            document.getElementById("authPassword").value;

        if (!name) {
            throw new Error("Enter your full name.");
        }

        if (!email) {
            throw new Error("Enter your email address.");
        }

        if (password.length < 6) {
            throw new Error(
                "Your password must contain at least 6 characters."
            );
        }

        const result =
            await auth.createUserWithEmailAndPassword(
                email,
                password
            );

        await db
            .collection("users")
            .doc(result.user.uid)
            .set(
                {
                    uid: result.user.uid,
                    email,
                    name,
                    status: "active",
                    profileComplete: false,
                    createdAt:
                        firebase.firestore.FieldValue.serverTimestamp(),
                    lastSeenAt:
                        firebase.firestore.FieldValue.serverTimestamp()
                },
                { merge: true }
            );

        const fullNameInput =
            document.getElementById("fullName");

        if (fullNameInput) {
            fullNameInput.value = name;
        }

        authMsg.textContent = "";
        showOnboarding(name);
    } catch (error) {
        showAccountScreen(error.message);
    }
});

loginBtn.addEventListener("click", async () => {
    try {
        authMsg.textContent = "Signing in...";

        const email = document
            .getElementById("authEmail")
            .value
            .trim();

        const password =
            document.getElementById("authPassword").value;

        if (!email || !password) {
            throw new Error(
                "Enter your email address and password."
            );
        }

        await auth.signInWithEmailAndPassword(
            email,
            password
        );
    } catch (error) {
        showAccountScreen(error.message);
    }
});

resetBtn.addEventListener("click", async () => {
    try {
        const email = document
            .getElementById("authEmail")
            .value
            .trim();

        if (!email) {
            throw new Error(
                "Enter your email address first."
            );
        }

        await auth.sendPasswordResetEmail(email);

        authMsg.textContent =
            "Password reset email sent.";
    } catch (error) {
        authMsg.textContent = error.message;
    }
});

auth.onAuthStateChanged(async user => {
    /*
     * Keep every real screen hidden until all Firebase checks finish.
     */
    showLoading();

    if (!user) {
        cloudUser = null;
        showAccountScreen();
        return;
    }

    cloudUser = user;

    try {
        const userRef = db
            .collection("users")
            .doc(user.uid);

        const userSnapshot = await userRef.get();
        const userRecord = userSnapshot.exists
            ? userSnapshot.data()
            : {};

        if (userRecord.status === "suspended") {
            await auth.signOut();

            showAccountScreen(
                "This UniSteady account is suspended."
            );

            return;
        }

        await userRef.set(
            {
                uid: user.uid,
                email: user.email,
                status: userRecord.status || "active",
                lastSeenAt:
                    firebase.firestore.FieldValue.serverTimestamp()
            },
            { merge: true }
        );

        const cloudStateSnapshot = await userRef
            .collection("private")
            .doc("state")
            .get();

        if (
            cloudStateSnapshot.exists &&
            cloudStateSnapshot.data().data
        ) {
            state = Object.assign(
                structuredClone(DEFAULT_STATE),
                cloudStateSnapshot.data().data
            );

            /*
             * Save locally without waiting for another cloud read.
             */
            localStorage.setItem(
                Store.key,
                JSON.stringify(state)
            );
        }

        if (typeof render === "function") {
            render();
        }

        if (profileIsComplete()) {
            showStudentApp();
        } else {
            showOnboarding(
                userRecord.name ||
                state?.profile?.name ||
                ""
            );
        }
    } catch (error) {
        console.error(
            "UniSteady startup error:",
            error
        );

        /*
         * Never expose all screens when startup fails.
         */
        showAccountScreen(
            "UniSteady could not finish loading. Check your internet connection and try again."
        );
    }
});

window.cloudAnnouncements = [];

db.collection("announcements")
    .where("active", "==", true)
    .onSnapshot(
        snapshot => {
            window.cloudAnnouncements =
                snapshot.docs.map(documentSnapshot => ({
                    id: documentSnapshot.id,
                    ...documentSnapshot.data()
                }));

            /*
             * Do not render the dashboard while authentication
             * is still loading or the user is signed out.
             */
            if (
                cloudUser &&
                studentApp &&
                !studentApp.hidden &&
                typeof render === "function"
            ) {
                render();
            }
        },
        error => {
            console.error(
                "Announcement listener error:",
                error
            );
        }
    );