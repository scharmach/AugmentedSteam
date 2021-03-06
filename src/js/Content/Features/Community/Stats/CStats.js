import ContextType from "../../../Modules/Context/ContextType";
import {CCommunityBase} from "../CCommunityBase";
import FAchievementSort from "./FAchievementSort";
import FExpandAchievementDesc from "./FExpandAchievementDesc";

export class CStats extends CCommunityBase {

    constructor() {

        // handle compare redirect
        if (window.location.hash === "#es-compare") {
            window.location.hash = "";
            if (/\/stats\/[^/]+(?!\/compare)\/?$/.test(window.location.pathname)) { // redirect to compare page but only if we're not there yet
                window.location = `${window.location.pathname.replace(/\/$/, "")}/compare`;
            }
        }

        super(ContextType.COMMUNITY_STATS, [
            FAchievementSort,
            FExpandAchievementDesc,
        ]);
    }
}
