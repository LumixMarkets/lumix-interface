import { FEATURES, type FeatureId, type ProductNavigationLabel } from "./app-routes";
import { AppFooter } from "./app-footer";
import { AppHeader } from "./app-header";
import { AppBackButton } from "./app-navigation";

type AppStatusPageProps = {
  context: string;
  title: string;
  description: string;
  activeItem?: ProductNavigationLabel | null;
};

export function AppStatusPage({ context, title, description, activeItem = null }: AppStatusPageProps) {
  return (
    <div className="trade-app-shell app-status-shell">
      <AppHeader activeItem={activeItem} />
      <main className="app-status-page trade-container">
        <section className="app-status-content" aria-labelledby="app-status-title">
          <p className="app-status-context">{context}</p>
          <h1 id="app-status-title">{title}</h1>
          <p className="app-status-description">{description}</p>
          <AppBackButton />
        </section>
      </main>
      <AppFooter />
    </div>
  );
}

export function ComingSoonPage({ feature }: { feature: FeatureId }) {
  const configuration = FEATURES[feature];
  return (
    <AppStatusPage
      context={configuration.label}
      title="Coming soon"
      description="We’re working on this. Check back soon."
      activeItem={configuration.label}
    />
  );
}
