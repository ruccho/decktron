export type PaneData = {
    id: string;
    session: SessionData;
    canGoBack: boolean;
    canGoForward: boolean;
};

export type SessionData = {
    id: string;
    user?: UserData;
    themeColor?: string;
}

export type UserData = {
    id: string;
    screenName: string;
    displayName: string;
    profileImageUrl: string;
}

export type XInitialState = {
    entities: {
        users: {
            entities: Record<string, {
                id_str: string,
                name: string,
                screen_name: string,
                location: string | null,
                url: string | null,
                description: string | null,
                verified: boolean,
                followers_count: number,
                friends_count: number,
                listed_count: number,
                favourites_count: number,
                statuses_count: number,
                created_at: string,
                profile_banner_url: string,
                profile_image_url_https: string,
                default_profile: boolean,
                default_profile_image: boolean,
                withheld_in_countries: string[],

                can_dm?: boolean,
                can_media_tag?: boolean,
                entities?: {
                    description?: {
                        urls?: []
                    },
                    url?: {
                        urls?:
                        {
                            display_url?: string,
                            expanded_url_?: string,
                            url?: string,
                            indices?: number[]
                        }[]
                    }
                },
                fast_followers_count?: number,
                has_custom_timelines?: boolean,
                is_translator?: boolean,
                media_count?: number,
                needs_phone_verification?: boolean,
                normal_followers_count?: number,
                pinned_tweet_ids_str?: string[],
                possibly_sensitive?: boolean,
                profile_interstitial_type?: string,
                translator_type?: string,
                want_retweets?: boolean,
                is_profile_translatable?: boolean,
                profile_image_shape?: string,
                is_blue_verified?: boolean,
                birthdate?: {
                    day?: number,
                    month?: number,
                    year?: number,
                    visibility?: string,
                    year_visibility?: string
                },
                has_graduated_access?: true,
                blocked_by?: boolean,
                muting?: boolean,
                blocking?: boolean
            }>
        }
    }
    
}