import { GoalRepository } from '../../../modules/goal/repository/goal-repository';
import { MarketingMetricsController } from '../../../modules/marketing-metrics/controller/marketing-metrics-controller';
import { MarketingMetricsRepository } from '../../../modules/marketing-metrics/repository/marketing-metrics-repository';
import { MarketingMetricsService } from '../../../modules/marketing-metrics/service/marketing-metrics-service';
export const makeMarketingMetricsController = () => {
  const marketingMetricsRepository = new MarketingMetricsRepository();
  const goalRepository = new GoalRepository();
  const marketingMetricsService = new MarketingMetricsService(
    marketingMetricsRepository,
    goalRepository
  );
  return new MarketingMetricsController(marketingMetricsService);
};
