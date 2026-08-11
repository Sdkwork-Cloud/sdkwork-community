//! Cross-service integration for the community service (membership package
//! registration and order payment verification).

pub mod commerce;

pub use commerce::{
    CommerceIntegration, CommerceIntegrationConfig, MembershipPackageRegistration,
    RegisteredMembershipPackage,
};
