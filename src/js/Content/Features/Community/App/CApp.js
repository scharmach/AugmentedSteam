import ContextType from "../../../Modules/Context/ContextType";
import {GameId} from "../../../../Core/GameId";
import FHighlightsTags from "../../Common/FHighlightsTags";
import FSkipAgecheck from "../../Common/FSkipAgecheck";
import {CCommunityBase} from "../CCommunityBase";
import FCommunityAppPageLinks from "./FCommunityAppPageLinks";
import FCommunityAppPageWishlist from "./FCommunityAppPageWishlist";

export class CApp extends CCommunityBase {

    constructor(type = ContextType.COMMUNITY_APP, features = []) {

        features.push(
            FCommunityAppPageLinks,
            FCommunityAppPageWishlist,
            FSkipAgecheck,
        );

        super(type, features);

        this.appid = GameId.getAppid(window.location.href);

        FHighlightsTags.highlightTitle(this.appid);

        const node = document.querySelector(".apphub_background");
        if (node) {
            new MutationObserver(() => {
                this.triggerCallbacks();
            }).observe(node, {"attributes": true}); // display changes to none if age gate is shown
        }
    }
}
