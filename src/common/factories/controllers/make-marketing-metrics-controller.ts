import { GoalRepository } from '../../../modules/goal/repository/goal-repository';
import { MarketingMetricsController } from '../../../modules/marketing-metrics/controller/marketing-metrics-controller';
import { MarketingMetricsRepository } from '../../../modules/marketing-metrics/repository/marketing-metrics-repository';
import { MarketingMetricsService } from '../../../modules/marketing-metrics/service/marketing-metrics-service';
import { SaleRepository } from '../../../modules/sale/repository/sale-repository';
export const makeMarketingMetricsController = () => {
  const marketingMetricsRepository = new MarketingMetricsRepository();
  const goalRepository = new GoalRepository();
  const saleRepository = new SaleRepository();
  const marketingMetricsService = new MarketingMetricsService(
    marketingMetricsRepository,
    goalRepository,
    saleRepository
  );
  return new MarketingMetricsController(marketingMetricsService);
};
