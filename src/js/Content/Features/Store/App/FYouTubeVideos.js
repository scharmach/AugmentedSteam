import {HTML, Language, Localization, SyncedStorage} from "../../../../modulesCore";
import {Feature} from "../../../modulesContent";

export default class FYouTubeVideos extends Feature {

    checkPrerequisites() {
        return SyncedStorage.get("showyoutubegameplay") || SyncedStorage.get("showyoutubereviews");
    }

    apply() {
        let ytTabsHtml = "";

        if (SyncedStorage.get("showyoutubegameplay")) {
            ytTabsHtml
                += `<div class="js-tab-yt-gameplay js-tab-yt js-tab es_tab home_tab">
                        <div class="tab_content">${Localization.str.youtube_gameplay}</div>
                    </div>`;
        }

        if (SyncedStorage.get("showyoutubereviews")) {
            ytTabsHtml
                += `<div class="js-tab-yt-review js-tab-yt js-tab es_tab home_tab">
                        <div class="tab_content">${Localization.str.youtube_reviews}</div>
                    </div>`;
        }

        HTML.afterBegin(".leftcol",
            `<div class="es_tabs">
                <div class="home_tabs_row">
                    <div class="js-tab-steam js-tab es_tab home_tab active">
                        <div class="tab_content">Steam</div>
                    </div>
                    ${ytTabsHtml}
                </div>
            </div>`);

        /*
         *  The separation of the tabs bar allows us to place the media slider right above the top right corner of the player.
         *  This empty div is inserted here in order to keep the same height difference between the left and the right column.
         */
        HTML.afterBegin(".rightcol", '<div style="height: 31px;"></div>');

        const steamTab = document.querySelector(".js-tab-steam");

        this._tabToMedia = new Map([
            [steamTab, document.querySelector(".highlight_overflow")],
        ]);

        steamTab.addEventListener("click", () => { this._setActiveTab(steamTab); });

        if (SyncedStorage.get("showyoutubegameplay")) {
            const gamePlayTab = document.querySelector(".js-tab-yt-gameplay");

            gamePlayTab.addEventListener("click", () => {
                if (!this._tabToMedia.has(gamePlayTab)) {
                    const gamePlayMedia = this._getIframe(Localization.str.gameplay);

                    document.querySelector(".highlight_ctn")
                        .insertAdjacentElement("beforeend", gamePlayMedia);

                    this._tabToMedia.set(gamePlayTab, gamePlayMedia);
                }

                this._setActiveTab(gamePlayTab);
            });
        }

        if (SyncedStorage.get("showyoutubereviews")) {
            const reviewTab = document.querySelector(".js-tab-yt-review");

            reviewTab.addEventListener("click", () => {
                if (!this._tabToMedia.has(reviewTab)) {
                    const reviewMedia = this._getIframe(Localization.str.review);

                    document.querySelector(".highlight_ctn")
                        .insertAdjacentElement("beforeend", reviewMedia);

                    this._tabToMedia.set(reviewTab, reviewMedia);
                }

                this._setActiveTab(reviewTab);
            });
        }
    }

    _setActiveTab(tab) {
        const activeTab = document.querySelector(".js-tab.active");
        if (activeTab === tab) { return; }

        const media = this._tabToMedia.get(tab);
        const activeMedia = this._tabToMedia.get(activeTab);

        if (activeTab.classList.contains("js-tab-steam")) {
            Page.runInPageContext(() => { SteamOnWebPanelHidden(); }); // eslint-disable-line no-undef, new-cap
        } else if (activeTab.classList.contains("js-tab-yt")) {
            activeMedia.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', "https://www.youtube.com");
        }

        activeMedia.style.display = "none";
        activeTab.classList.remove("active");

        media.style.display = "block";
        tab.classList.add("active");

        if (tab.classList.contains("js-tab-steam")) {
            Page.runInPageContext(() => { SteamOnWebPanelShown(); }); // eslint-disable-line no-undef, new-cap
        }
    }

    _getIframe(searchQuery) {

        const listParam = encodeURIComponent(

            // Remove trademarks etc
            `intitle:"${this.context.appName.replace(/[\u00AE\u00A9\u2122]/g, "")} ${searchQuery}" "PC"`
        );

        const hlParam = encodeURIComponent(Language.getLanguageCode(Language.getCurrentSteamLanguage()));

        const player = document.createElement("iframe");
        player.classList.add("es_youtube_player");
        player.type = "text/html";
        player.src = `https://www.youtube.com/embed?listType=search&list=${listParam}&origin=https://store.steampowered.com&widget_referrer=https://steamaugmented.com&hl=${hlParam}&enablejsapi=1`;
        player.allowFullscreen = true;

        return player;
    }
}
