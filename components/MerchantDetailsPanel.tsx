import React from "react";
import { X, User, Store, Calendar, CreditCard, Package, MapPin, Printer } from "lucide-react";
import { Badge } from "./Badge";
import { Button } from "./Button";
import { MerchantUser } from "../endpoints/merchant-users_GET.schema";
import styles from "./MerchantDetailsPanel.module.css";

interface MerchantDetailsPanelProps {
  user: MerchantUser | null;
  isLoading: boolean;
  onClose: () => void;
}

export const MerchantDetailsPanel = ({ user, isLoading, onClose }: MerchantDetailsPanelProps) => {
  if (isLoading) {
    return (
      <>
        <div className={styles.overlay} onClick={onClose} aria-hidden="true" />
        <div className={styles.panel} role="dialog" aria-labelledby="merchant-details-title">
          <div className={styles.header}>
            <h3 className={styles.title} id="merchant-details-title">Merchant Details</h3>
            <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close merchant details panel">
              <X size={20} />
            </Button>
          </div>
          <div className={styles.loading}>Loading merchant details...</div>
        </div>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <div className={styles.overlay} onClick={onClose} aria-hidden="true" />
        <div className={styles.panel} role="dialog" aria-labelledby="merchant-details-title">
          <div className={styles.header}>
            <h3 className={styles.title} id="merchant-details-title">Merchant Details</h3>
            <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close merchant details panel">
              <X size={20} />
            </Button>
          </div>
          <div className={styles.noData}>No merchant details found for this email.</div>
        </div>
      </>
    );
  }

  // Parse JSON fields
  let defaultLocation = null;
  let defaultPostagePackage = null;
  let defaultPrinting = null;

  try {
    if (user.defaultLocation) {
      defaultLocation = JSON.parse(user.defaultLocation);
    }
  } catch (e) {
    console.error("Failed to parse defaultLocation", e);
  }

  try {
    if (user.defaultPostagePackageOption) {
      defaultPostagePackage = JSON.parse(user.defaultPostagePackageOption);
    }
  } catch (e) {
    console.error("Failed to parse defaultPostagePackageOption", e);
  }

  try {
    if (user.defaultPrintingOption) {
      defaultPrinting = JSON.parse(user.defaultPrintingOption);
    }
  } catch (e) {
    console.error("Failed to parse defaultPrintingOption", e);
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleString();
  };

  return (
    <>
      {/* Overlay/backdrop - clicking it closes the panel */}
      <div className={styles.overlay} onClick={onClose} aria-hidden="true" />

      <div className={styles.panel} role="dialog" aria-labelledby="merchant-details-title">
        <div className={styles.header}>
          <h3 className={styles.title} id="merchant-details-title">Merchant Details</h3>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            aria-label="Close merchant details panel"
          >
            <X size={20} />
          </Button>
        </div>

        <div className={styles.content}>
        {/* Account Information */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <User size={16} />
            <h4>Account Information</h4>
          </div>
          <div className={styles.details}>
            <div className={styles.detailRow}>
              <span className={styles.label}>Email:</span>
              <span className={styles.value}>{user.email}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.label}>User ID:</span>
              <span className={styles.value}>{user.id}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.label}>Onboarding:</span>
              <Badge variant={user.isOnboardingDone ? "success" : "warning"}>
                {user.isOnboardingDone ? "Completed" : "Pending"}
              </Badge>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.label}>Last Login:</span>
              <span className={styles.value}>{formatDate(user.lastLogin)}</span>
            </div>
          </div>
        </section>

        {/* Store Information */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <Store size={16} />
            <h4>Store Information</h4>
          </div>
          <div className={styles.details}>
            <div className={styles.detailRow}>
              <span className={styles.label}>Shop Name:</span>
              <span className={styles.value}>{user.shopName || "N/A"}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.label}>Shopify Store URL:</span>
              <span className={styles.value}>{user.shopifyStoreUrl}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.label}>Total Shipments:</span>
              <span className={styles.value}>{user.totalShipmentsCount.toLocaleString()}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.label}>Locale:</span>
              <span className={styles.value}>{user.locale || "N/A"}</span>
            </div>
          </div>
        </section>

        {/* Billing Information */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <CreditCard size={16} />
            <h4>Billing Information</h4>
          </div>
          <div className={styles.details}>
            <div className={styles.detailRow}>
              <span className={styles.label}>Billing Plan:</span>
              <Badge variant={user.billingPlan === "Pro" ? "default" : "secondary"}>
                {user.billingPlan || "Free"}
              </Badge>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.label}>Billing Cycle End:</span>
              <span className={styles.value}>{formatDate(user.billingCycleEnd)}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.label}>MyPost Account:</span>
              <span className={styles.value}>{user.mypostAccountNumber || "N/A"}</span>
            </div>
          </div>
        </section>

        {/* Default Location */}
        {defaultLocation && (
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <MapPin size={16} />
              <h4>Default Location</h4>
            </div>
            <div className={styles.details}>
              <div className={styles.detailRow}>
                <span className={styles.label}>Address:</span>
                <span className={styles.value}>
                  {defaultLocation.address}
                  {defaultLocation.suite && `, ${defaultLocation.suite}`}
                </span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.label}>City:</span>
                <span className={styles.value}>
                  {defaultLocation.suburb}, {defaultLocation.state} {defaultLocation.postalCode}
                </span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.label}>Country:</span>
                <span className={styles.value}>{defaultLocation.country}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.label}>Phone:</span>
                <span className={styles.value}>{defaultLocation.phone}</span>
              </div>
            </div>
          </section>
        )}

        {/* Default Postage & Package */}
        {defaultPostagePackage && (
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <Package size={16} />
              <h4>Default Postage & Package</h4>
            </div>
            <div className={styles.details}>
              <div className={styles.detailRow}>
                <span className={styles.label}>Package:</span>
                <span className={styles.value}>
                  {defaultPostagePackage.selectedPackageName} ({defaultPostagePackage.selectedPackageDimensions})
                </span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.label}>Type:</span>
                <span className={styles.value}>{defaultPostagePackage.selectedPackageType}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.label}>Signature on Delivery:</span>
                <Badge variant={defaultPostagePackage.signatureOnDelivery ? "default" : "outline"}>
                  {defaultPostagePackage.signatureOnDelivery ? "Yes" : "No"}
                </Badge>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.label}>Extra Cover:</span>
                <Badge variant={defaultPostagePackage.extraCover ? "default" : "outline"}>
                  {defaultPostagePackage.extraCover ? "Yes" : "No"}
                </Badge>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.label}>Aviation Security:</span>
                <Badge variant={defaultPostagePackage.aviationSecurity ? "default" : "outline"}>
                  {defaultPostagePackage.aviationSecurity ? "Yes" : "No"}
                </Badge>
              </div>
            </div>
          </section>
        )}

        {/* Default Printing */}
        {defaultPrinting && (
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <Printer size={16} />
              <h4>Default Printing Options</h4>
            </div>
            <div className={styles.details}>
              <div className={styles.detailRow}>
                <span className={styles.label}>Domestic Layout:</span>
                <span className={styles.value}>{defaultPrinting.domesticLayout}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.label}>International Layout:</span>
                <span className={styles.value}>{defaultPrinting.internationalLayout}</span>
              </div>
            </div>
          </section>
        )}

        {/* Timestamps */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <Calendar size={16} />
            <h4>Account Dates</h4>
          </div>
          <div className={styles.details}>
            <div className={styles.detailRow}>
              <span className={styles.label}>Created At:</span>
              <span className={styles.value}>{formatDate(user.createdAt)}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.label}>Updated At:</span>
              <span className={styles.value}>{formatDate(user.updatedAt)}</span>
            </div>
          </div>
        </section>
      </div>
    </div>
    </>
  );
};
