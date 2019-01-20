
let AgeCheck = (function(){

    let self = {};

    self.sendVerification = function(){
        if (!SyncedStorage.get("send_age_info", true)) { return; }

        let ageYearNode = document.querySelector("#ageYear");
        if (ageYearNode) {
            let myYear = Math.floor(Math.random()*75)+10;
            ageYearNode.value = "19" + myYear;
            document.querySelector(".btnv6_blue_hoverfade").click();
        } else {
            let btn = document.querySelector(".agegate_text_container.btns a");
            if (btn && btn.getAttribute("href") === "#") {
                btn.click();
            }
        }

        let continueNode = document.querySelector("#age_gate_btn_continue");
        if (continueNode) {
            continueNode.click();
        }
    };

    return self;
})();


let AppPageClass = (function(){

    function AppPageClass(url) {
        this.appid = GameId.getAppid(url);
        let metalinkNode = document.querySelector("#game_area_metalink a");
        this.metalink = metalinkNode && metalinkNode.getAttribute("href");

        this.data = this.storePageDataPromise();
        this.appName = document.querySelector(".apphub_AppName").textContent;
    }

    AppPageClass.prototype.isDlc = function() {
        return document.querySelector("div.game_area_dlc_bubble") ? true : false;
    };

    AppPageClass.prototype.mediaSliderExpander = function() {
        let detailsBuild = false;
        let details  = document.querySelector("#game_highlights .rightcol, .workshop_item_header .col_right");

        if (details) {
            document.querySelector("#highlight_player_area").insertAdjacentHTML("beforeend", `
                <div class="es_slider_toggle btnv6_blue_hoverfade btn_medium">
                    <div data-slider-tooltip="` + Localization.str.expand_slider + `" class="es_slider_expand"><i class="es_slider_toggle_icon"></i></div>
                    <div data-slider-tooltip="` + Localization.str.contract_slider + `" class="es_slider_contract"><i class="es_slider_toggle_icon"></i></div>
                </div>
            `);
        }

        // Initiate tooltip
        ExtensionLayer.runInPageContext(function() { $J('[data-slider-tooltip]').v_tooltip({'tooltipClass': 'store_tooltip community_tooltip', 'dataName': 'sliderTooltip' }); });

        // FIXME media slider not finished
    };

    AppPageClass.prototype.initHdPlayer = function() {
        // FIXME
    };

    AppPageClass.prototype.storePageDataPromise = function() {
        let appid = this.appid;
        return new Promise(function(resolve, reject) {
            let cache = LocalData.get("storePageData_" + appid);

            if (cache && cache.data && !TimeHelper.isExpired(cache.updated, 3600)) {
                resolve(cache.data);
                return;
            }

            let apiparams = {
                appid: appid
            };
            if (this.metalink) {
                apiparams.mcurl = this.metalink;
            }
            if (SyncedStorage.get("showoc", true)) {
                apiparams.oc = 1;
            }

            Request.getApi("v01/storepagedata", apiparams)
                .then(function(response) {
                    if (response && response.result && response.result === "success") {
                        LocalData.set("storePageData_" + appid, {
                            data: response.data,
                            updated: Date.now(),
                        });
                        resolve(response.data);
                    } else {
                        reject();
                    }
                }, reject);
        });
    };

    /**
     *  Allows the user to intuitively remove an item from their wishlist on the app page
     */
    AppPageClass.prototype.addWishlistRemove = function() {
        if (!User.isSignedIn) { return; }
        let appid = this.appid;

        // there is no add to wishlist button and game is not purchased yet, add required nodes
        if (!document.querySelector("#add_to_wishlist_area") && !document.querySelector(".game_area_already_owned")) {
            let firstButton = document.querySelector(".queue_actions_ctn a.queue_btn_active");
            firstButton.insertAdjacentHTML("beforebegin", "<div id='add_to_wishlist_area_success' style='display: inline-block;'></div>");

            let wishlistArea = document.querySelector("#add_to_wishlist_area_success");
            DOMHelper.wrap(wishlistArea, firstButton);
            wishlistArea.insertAdjacentHTML("beforebegin", `<div id='add_to_wishlist_area' style='display: none;'><a class='btnv6_blue_hoverfade btn_medium' href='javascript:AddToWishlist(${appid}, \\"add_to_wishlist_area\\", \\"add_to_wishlist_area_success\\", \\"add_to_wishlist_area_fail\\", \\"1_5_9__407\\" );'><span>${Localization.str.add_to_wishlist}</span></a></div>`);
            wishlistArea.insertAdjacentHTML("beforebegin", `<div id='add_to_wishlist_area_fail' style='display: none;'></div>`);
        }

        let successNode = document.querySelector("#add_to_wishlist_area_success");
        if (!successNode) { return; }

        let imgNode = successNode.querySelector("img:last-child");
        if (!imgNode) { return; }

        imgNode.classList.add("es-in-wl");
        imgNode.insertAdjacentHTML("beforebegin", `<img class='es-remove-wl' src='${ExtensionLayer.getLocalUrl("img/remove.png")}' style='display:none' />`);
        imgNode.insertAdjacentHTML("beforebegin", `<img class='es-loading-wl' src='//steamcommunity-a.akamaihd.net/public/images/login/throbber.gif' style='display:none; width:16px' />`);

        successNode.addEventListener("click", function(e){
            e.preventDefault();

            let parent = successNode.parentNode;
            if (!parent.classList.contains("loading")) {
                parent.classList.add("loading");


                Request.post("//store.steampowered.com/api/removefromwishlist", {
                    sessionid: User.getSessionId(),
                    appid: appid
                }, {withCredentials: true}).then(response => {
                    document.querySelector("#add_to_wishlist_area").style.display = "inline";
                    document.querySelector("#add_to_wishlist_area_success").style.display = "none";

                    // Clear dynamicstore cache
                    /* // FIXME DynamicStore
                    chrome.storage.local.remove("dynamicstore");
                    */

                    // Invalidate dynamic store data cache
                    ExtensionLayer.runInPageContext("function(){ GDynamicStore.InvalidateCache(); }");
                }).finally(() => {
                    parent.classList.remove("loading");
                });
            }
        });

        /* // FIXME clear dynamic store
        $("#add_to_wishlist_area, #add_to_wishlist_area_success, .queue_btn_ignore").on("click", function(){
            // Clear dynamicstore cache
            chrome.storage.local.remove("dynamicstore");
        });
        */
    };

    AppPageClass.prototype.getFirstSubid = function() {
        let node = document.querySelector("div.game_area_purchase_game input[name=subid]");
        return node && node.value;
    };

    AppPageClass.prototype.addCoupon = function() {
        let inst = this;
        Inventory.promise().then(() => {

            console.log(inst.getFirstSubid());

            let coupon = Inventory.getCoupon(inst.getFirstSubid());
            if (!coupon) { return; }

            let couponDate = coupon.valid && coupon.valid.replace(/\[date](.+)\[\/date]/, function(m0, m1) { return new Date(m1 * 1000).toLocaleString(); });

            let purchaseArea = document.querySelector("#game_area_purchase");
            purchaseArea.insertAdjacentHTML("beforebegin", `
<div class="early_access_header">
    <div class="heading">
        <h1 class="inset">${Localization.str.coupon_available}</h1>
        <h2 class="inset">${Localization.str.coupon_application_note}</h2>
        <p>${Localization.str.coupon_learn_more}</p>
    </div>
    <div class="devnotes">
        <div style="display:flex;padding-top:10px">
            <img src="http://cdn.steamcommunity.com/economy/image/${coupon.image_url}" style="width:96px;height:64px;"/>
            <div style="display:flex;flex-direction:column;margin-left:10px">
                <h1>${coupon.title}</h1>
                <div>${coupon.discount_note || ""}</div>
                <div style="color:#a75124">${couponDate}</div>
            </div>
        </div>
    </div>
</div>`);

            // TODO show price in purchase box
        });
    };

    AppPageClass.prototype.addPrices = function() {
        if (!SyncedStorage.get("showlowestprice", true)) { return; }

        let apiParams = {};

        if (!SyncedStorage.get("showallstores", true) && SyncedStorage.get("stores", []).length > 0) {
            apiParams.stores = SyncedStorage.get("stores", []).join(",");
        }

        let cc = User.getCountry();
        if (cc) {
            apiParams.cc = cc;
        }

        let subids = [];
        let nodes = document.querySelectorAll("input[name=subid]");
        for (let i=0, len=nodes.length; i<len; i++) {
            let node = nodes[i];
            subids.push(node.value);
        }
        apiParams.subs = subids.join(",");

        let bundleids = [];
        nodes = document.querySelectorAll(".game_area_purchase_game_wrapper[data-ds-bundleid]");
        for (let i=0, len=nodes.length; i<len; i++) {
            let node = nodes[i];
            bundleids.push(node.dataset['dsBundleid']);
        }
        apiParams.bundleids = bundleids.join(",");

        if (SyncedStorage.get("showlowestpricecoupon", true)) {
            apiParams.coupon = true;
        }

        Request.getApi("v01/prices", apiParams).then(response => {
            if (!response || response.result !== "success") { return; }

            let bundles = [];

            for (let gameid in response.data.data) {
                if (!response.data.data.hasOwnProperty(gameid)) { continue; }

                let a = gameid.split("/");
                let type = a[0];
                let id = a[1];
                let meta = response.data['.meta'];
                let info = response.data.data[gameid];

                let activates = "";
                let line1 = "";
                let line2 = "";
                let line3 = "";
                let html;

                // "Lowest Price"
                if (info['price']) {
                    if (info['price']['drm'] === "steam" && info['price']['store'] !== "Steam") {
                        activates = "(<b>" + Localization.str.activates + "</b>)";
                    }

                    let infoUrl = BrowserHelper.escapeHTML(info["urls"]["info"].toString());
                    let priceUrl = BrowserHelper.escapeHTML(info["price"]["url"].toString());
                    let store = BrowserHelper.escapeHTML(info["price"]["store"].toString());

                    let lowest;
                    let voucherStr = "";
                    if (SyncedStorage.get("showlowetpricecoupon", true) && info['price']['price_voucher']) {
                        lowest = new Price(info['price']['price_voucher'], meta['currency']);
                        let voucher = BrowserHelper.escapeHTML(info['price']['voucher']);
                        voucherStr = `${Localization.str.after_coupon} <b>${voucher}</b>`;
                    } else {
                        lowest = new Price(info['price']['price'], meta['currency']);
                    }

                    let lowestStr = Localization.str.lowest_price_format
                        .replace("__price__", lowest.toString())
                        .replace("__store__", `<a href="${priceUrl}" target="_blank">${store}</a>`)

                    line1 = `${Localization.str.lowest_price}: 
                             ${lowestStr} ${voucherStr} ${activates}
                             (<a href="${infoUrl}" target="_blank">${Localization.str.info}</a>)`;
                }

                // "Historical Low"
                if (info["lowest"]) {
                    let historical = new Price(info['lowest']['price'], meta['currency']);
                    let recorded = new Date(info["lowest"]["recorded"]*1000);

                    let historicalStr = Localization.str.historical_low_format
                        .replace("__price__", historical.toString())
                        .replace("__store__", BrowserHelper.escapeHTML(info['lowest']['store']))
                        .replace("__date__", recorded.toLocaleDateString());

                    let url = BrowserHelper.escapeHTML(info['urls']['history']);

                    line2 = `${Localization.str.historical_low}: ${historicalStr} (<a href="${url}" target="_blank">${Localization.str.info}</a>)`;
                }

                let chartImg = ExtensionLayer.getLocalUrl("img/line_chart.png");
                html = `<div class='es_lowest_price' id='es_price_${id}'><div class='gift_icon' id='es_line_chart_${id}'><img src='${chartImg}'></div>`;

                // "Number of times this game has been in a bundle"
                if (info["bundles"]["count"] > 0) {
                    line3 = `${Localization.str.bundle.bundle_count}: ${info['bundles']['count']}`;
                    let bundlesUrl = BrowserHelper.escapeHTML(info["urls"]["bundles"] || info["urls"]["bundle_history"]);
                    if (typeof bundles_url === "string" && bundles_url.length > 0) {
                        line3 += ` (<a href="${bundlesUrl}" target="_blank">${Localization.str.info}</a>)`;
                    }
                }

                if (line1 || line2) {
                    let node;
                    if (type === "sub") {
                        node = document.querySelector("input[name=subid][value='"+id+"']").parentNode.parentNode.parentNode;
                    } else if (type === "bundle") {
                        node = document.querySelector(".game_area_purchase_game_wrapper[data-ds-bundleid='"+id+"']");
                    }

                    node.insertAdjacentHTML("afterbegin", html + "<div>" + line1 + "</div><div>" + line2 + "</div>" + line3);
                    document.querySelector("#es_line_chart_"+id).style.top = ((document.querySelector("#es_price_"+id).offsetHeight - 20) / 2) + "px";
                }

                // add bundles
                if (info["bundles"]["live"].length > 0) {
                    let length = info["bundles"]["live"].length;
                    for (let i = 0; i < length; i++) {
                        let bundle = info["bundles"]["live"][i];
                        let endDate;
                        if (bundle["expiry"]) {
                            endDate = new Date(bundle["expiry"]*1000);
                        }

                        let currentDate = new Date().getTime();
                        if (endDate && currentDate > endDate) { continue; }

                        let bundle_normalized = JSON.stringify({
                            page:  bundle.page || "",
                            title: bundle.title || "",
                            url:   bundle.url || "",
                            tiers: (function() {
                                let tiers = [];
                                for (let tier in bundle.tiers) {
                                    tiers.push((bundle.tiers[tier].games || []).sort());
                                }
                                return tiers;
                            })()
                        });

                        if (bundles.indexOf(bundle_normalized) >= 0) { continue; }
                        bundles.push(bundle_normalized);

                        let purchase = "";
                        if (bundle.page) {
                            let bundlePage = Localization.str.buy_package.replace("__package__", bundle.page + ' ' + bundle.title);
                            purchase = `<div class="game_area_purchase_game"><div class="game_area_purchase_platform"></div><h1>${bundlePage}</h1>`;
                        } else {
                            let bundleTitle = Localization.str.buy_package.replace("__package__", bundle.title);
                            purchase = `<div class="game_area_purchase_game_wrapper"><div class="game_area_purchase_game"></div><div class="game_area_purchase_platform"></div><h1>${bundleTitle}</h1>`;
                        }

                        if (endDate) {
                            purchase += `<p class="game_purchase_discount_countdown">${Localization.str.bundle.offer_ends} ${endDate}</p>`;
                        }

                        purchase += '<p class="package_contents">';

                        let bundlePrice;
                        let appName = this.appName;

                        for (let t=0; t<bundle.tiers.length; t++) {
                            let tier = bundle.tiers[t];
                            let tierNum = t + 1;

                            purchase += '<b>';
                            if (bundle.tiers.length > 1) {
                                let tierName = tier.note || Localization.str.bundle.tier.replace("__num__", tierNum);
                                let tierPrice = new Price(tier.price, meta['currency']).toString();

                                purchase += Localization.str.bundle.tier_includes.replace("__tier__", tierName).replace("__price__", tierPrice).replace("__num__", tier.games.length);
                            } else {
                                purchase += Localization.str.bundle.includes.replace("__num__", tier.games.length);
                            }
                            purchase += ':</b> ';

                            let gameList = tier.games.join(", ");
                            if (gameList.includes(appName)) {
                                purchase += gameList.replace(appName, "<u>"+appName+"</u>");
                                bundlePrice = tier.price;
                            } else {
                                purchase += gameList;
                            }

                            purchase += "<br>";
                        }

                        purchase += "</p>";
                        purchase += `<div class="game_purchase_action">
                                         <div class="game_purchase_action_bg">
                                             <div class="btn_addtocart btn_packageinfo">
                                                 <a class="btnv6_blue_blue_innerfade btn_medium" href="${bundle.details}" target="_blank">
                                                     <span>${Localization.str.bundle.info}</span>
                                                 </a>
                                             </div>
                                         </div>`;

                        purchase += '<div class="game_purchase_action_bg">';
                        if (bundlePrice && bundlePrice > 0) {
                            purchase += '<div class="game_purchase_price price" itemprop="price">';
                            purchase += (new Price(bundlePrice, meta['currency'])).toString();
                        }
                        purchase += '</div>';

                        purchase += '<div class="btn_addtocart">';
                        purchase += '<a class="btnv6_green_white_innerfade btn_medium" href="' + bundle["url"] + '" target="_blank">';
                        purchase += '<span>' + Localization.str.buy + '</span>';
                        purchase += '</a></div></div></div></div>';

                        document.querySelector("#game_area_purchase")
                            .insertAdjacentHTML("afterend", "<h2 class='gradientbg'>" + Localization.str.bundle.header + " <img src='http://store.steampowered.com/public/images/v5/ico_external_link.gif' border='0' align='bottom'></h2>" + purchase);
                    }
                }
            }
        });
    };

    AppPageClass.prototype.addDlcInfo = function() {
        if (!this.isDlc()) { return; }

        Request.getApi("v01/dlcinfo", {appid: this.appid, appname: encodeURIComponent(this.appName)}).then(response => {
            console.log(response);
            let html = `<div class='block responsive_apppage_details_right heading'>${Localization.str.dlc_details}</div><div class='block'><div class='block_content'><div class='block_content_inner'><div class='details_block'>`;

            if (response && response.result === "success") {
                for(let i=0, len=response.data.length; i<len; i++) {

                    let item = response.data[i];
                    let iconUrl = Config.CdnHost + "/gamedata/icons/" + encodeURIComponent(item.icon);
                    let title = BrowserHelper.escapeHTML(item.desc);
                    let name = BrowserHelper.escapeHTML(item.name);
                    html += `<div class='game_area_details_specs'><div class='icon'><img src='${iconUrl}' align='top'></div><a class='name' title='${title}'>${name}</a></div>`;
                }
            }

            let suggestUrl = Config.PublicHost + "/gamedata/dlc_category_suggest.php?appid=" + this.appid + "&appname=" + encodeURIComponent(this.appName);
            html += `</div><a class='linkbar' style='margin-top: 10px;' href='${suggestUrl}' target='_blank'>${Localization.str.dlc_suggest}</a></div></div></div>`;

            document.querySelector("#category_block").parentNode.insertAdjacentHTML("beforebegin", html);
        });
    };

    return AppPageClass;
})();


(function(){
    let path = window.location.pathname.replace(/\/+/g, "/");

    console.log("Running store");

    SyncedStorage
        .load()
        .finally(() => Promise
            .all([Localization.promise(), User.promise(), Currency.promise()])
            .then(function(values) {
                console.log("ES loaded");

                ProgressBar.create();
                EnhancedSteam.checkVersion();
                EnhancedSteam.addMenu();
                EnhancedSteam.addLanguageWarning();
                EnhancedSteam.removeInstallSteamButton();
                EnhancedSteam.removeAboutMenu();
                EnhancedSteam.addHeaderLinks();
                EarlyAccess.showEarlyAccess();
                EnhancedSteam.disableLinkFilter();

                if (User.isSignedIn) {
                    EnhancedSteam.addRedeemLink();
                    EnhancedSteam.replaceAccountName();
                    EnhancedSteam.launchRandomButton();
                    // TODO add itad sync
                }

                // FIXME this should have better check for log out, not just logout link click
                // $('a[href$="javascript:Logout();"]').bind('click', clear_cache);

                // end of common part


                switch (true) {
                    case /\bagecheck\b/.test(path):
                        AgeCheck.sendVerification();
                        break;

                    case /^\/app\/.*/.test(path):
                        let appPage = new AppPageClass(window.location.host + path);
                        appPage.mediaSliderExpander();
                        appPage.initHdPlayer();
                        appPage.addWishlistRemove();
                        appPage.addCoupon();
                        appPage.addPrices();
                        appPage.addDlcInfo();

/*
                        dlc_data_from_site(appid);

                        drm_warnings("app");
                        add_metacritic_userscore();
                        add_opencritic_data(appid);
                        display_purchase_date();

                        add_widescreen_certification(appid);
                        add_hltb_info(appid);
                        add_steam_client_link(appid);
                        add_pcgamingwiki_link(appid);
                        add_steamcardexchange_link(appid);
                        add_app_page_highlights();
                        add_steamdb_links(appid, "app");
                        add_familysharing_warning(appid);
                        add_dlc_page_link(appid);
                        add_pack_breakdown();
                        add_package_info_button();
                        add_steamchart_info(appid);
                        add_steamspy_info(appid);
                        survey_data_from_site(appid);
                        add_system_requirements_check(appid);
                        add_app_badge_progress(appid);
                        add_dlc_checkboxes();
                        add_astats_link(appid);
                        add_achievement_completion_bar(appid);

                        show_regional_pricing("app");
                        add_review_toggle_button();

                        customize_app_page(appid);
                        add_help_button(appid);
                        skip_got_steam();

                        if (language == "schinese" || language == "tchinese") {
                            storePageDataCN.load(appid);
                            add_keylol_link();
                            add_steamcn_mods();
                            if (language == "schinese") add_chinese_name();
                        }

                        */
                        break;
                }


            })
    )

})();

