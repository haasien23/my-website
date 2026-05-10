# Platform Design

## 1. Design Goal

The platform is designed for the thesis topic `基于集群的多任务协同态势感知平台`.

It focuses on four capabilities:

1. Simulate a dynamic multi-UAV, multi-target environment.
2. Compare the thesis algorithm against the random UAV dispatch baseline.
3. Support parameter tuning for realistic sensing conditions.
4. Produce visual evidence for thesis experiments and chapter writing.

Current implementation note:

- Main implementation language: Python
- UI approach: Tkinter desktop interface
- Core modules: `app.py` and `simulator.py`

## 2. Scenario Model

The simulator uses a 2D mission area with:

- `N` UAV nodes
- `M` moving targets
- static obstacles
- limited sensing radius
- limited communication radius
- energy consumption
- sensor noise
- temporary node failure

Each target has:

- position
- velocity
- priority
- uncertainty radius

Each UAV has:

- position
- speed
- energy
- sensing bias
- communication bias
- current assignment
- obstacle-aware travel path

## 3. Improved Algorithm: RADS

`RADS` means `Risk-Aware Dynamic Scheduling`.

For each target `j`, task demand is computed by:

`demand_j = f(priority_j, uncertainty_j, target_speed_j)`

For each available UAV `i`, a utility score is computed:

`U(i,j) = 0.35C + 0.20E + 0.15L + 0.20R - 0.05T - 0.05D`

Where:

- `C`: coverage score
- `E`: remaining energy score
- `L`: communication link score
- `R`: task urgency score
- `T`: travel penalty
- `D`: redundancy penalty

Then a greedy multi-task assignment is performed under a global dispatch budget.

In the current implementation, the assignment also considers:

- obstacle-aware shortest-path distance
- line-of-sight availability
- limited sensing radius
- dynamic re-selection of UAV subsets at each step

## 4. Fusion Method

Selected UAVs generate noisy measurements of the target position.

The fused estimate is calculated by weighted averaging:

`x_hat = sum(w_i * x_i) / sum(w_i)`

`y_hat = sum(w_i * y_i) / sum(w_i)`

Weights depend on:

- measurement variance
- remaining energy
- link quality
- sensing distance

The platform also computes a consensus-like consistency score from pairwise measurement spread.

## 5. Baseline

The baseline uses the same task demand and the same dispatch budget, but randomly selects UAVs for each task.

This ensures the comparison is fair and easy to explain in the thesis.

## 6. Metrics

The platform outputs:

- task success rate
- coverage rate
- mean fusion error
- cumulative energy cost
- average compute time per step

## 7. Visualization Layer

The UI contains:

- parameter panel
- metric summary strip
- timeline panel
- main world playback view
- random UAV dispatch view
- metric comparison board
- per-target comparison panel
- auto-generated experiment summary
- progress bar for incremental simulation

## 8. Thesis Value

This prototype can directly support:

- chapter 3 system design
- chapter 4 algorithm design
- chapter 5 collaborative fusion explanation
- chapter 6 experiment and comparison analysis
