use sdkwork_community_http::{
    all_routes, app_routes, backend_routes, open_routes, required_api_key_headers,
    required_dual_token_headers, HttpMethod,
};

#[test]
fn community_http_routes_use_sdkwork_v3_prefixes_and_resource_operation_ids() {
    assert_eq!(app_routes().len(), 9);
    assert_eq!(backend_routes().len(), 11);
    assert_eq!(open_routes().len(), 4);
    assert!(app_routes()
        .iter()
        .all(|route| route.path.starts_with("/app/v3/api/community")));
    assert!(backend_routes()
        .iter()
        .all(|route| route.path.starts_with("/backend/v3/api/community")));
    assert!(open_routes()
        .iter()
        .all(|route| route.path.starts_with("/community/v3/api")));
    assert!(all_routes().iter().all(|route| route.tag == "community"));
    assert!(all_routes().iter().all(|route| route.operation_id.contains('.')));
    assert!(backend_routes()
        .iter()
        .any(|route| route.method == HttpMethod::Post && route.operation_id == "entries.moderation.update"));
    assert_eq!(required_dual_token_headers(), ["Authorization", "Access-Token"]);
    assert_eq!(required_api_key_headers(), ["X-API-Key"]);
}
