# Fetal Health Classification

Cardiotocography (CTG) is a standard diagnostic tool used to monitor fetal health during pregnancy and labor. However, manually reading CTG charts can lead to inconsistent interpretations and missed warning signs. 

In this project, I developed and evaluated several machine learning models—Random Forest, XGBoost, and a Deep Learning Multi-Layer Perceptron (MLP)—to classify CTG data into three categories: **Normal**, **Suspect**, and **Pathological**. 

Because misclassifying a high-risk fetus as healthy carries severe medical consequences, model evaluation prioritizes **Pathological class recall (minimizing false negatives)** along with overall Macro F1-score.

---

## 🎥 Project Video Presentation
Watch the complete project walkthrough and methodology explanation on YouTube:
Fetal Health Classification Project Walkthrough - https://youtu.be/oXodvUazF8I

---

**Medium Article:** Read Full CRISP-DM Write-up on Medium - https://medium.com/@vedantikanade/why-my-deep-learning-model-lost-to-xgboost-on-fetal-health-data-562a8c0fec39

---

## Methodology (CRISP-DM Workflow)

1. **Clinical & Problem Understanding**: Frame the objective around patient safety. Missing a high-risk case (Type II error) is significantly worse than a false alarm (Type I error).
2. **Data Exploration & Preprocessing**: Cleaned 2,126 CTG patient records across 21 continuous and discrete features. Scaled features using `StandardScaler` and applied SMOTE to resolve class imbalance across the target categories.
3. **Modeling**: Built, tuned, and compared tree-based ensemble models (Random Forest, XGBoost) against a Deep Learning MLP.
4. **Evaluation**: Assessed performance using One-vs-Rest (OvR) ROC-AUC curves, Macro F1, and class-specific recall metrics.
5. **Deployment Architecture**: Outlined a blueprint for integrating the trained pipeline into a real-time Clinical Decision Support System (CDSS).

---

## Key Findings

* **Top Model**: **XGBoost** provided the highest recall for Pathological cases while maintaining a high overall Macro F1-score.
* **Trees vs. Neural Networks**: Tree-based ensembles outperformed the Deep Learning MLP on this dataset. Decision trees handle continuous feature thresholds exceptionally well on tabular datasets of this size and closely align with medical diagnostic rules.

---

## Repository Structure

```text
├── fetal_health_classification.ipynb   # Complete analysis, preprocessing, and modeling code
├── fetal_health_classification.pdf     # PDF export of the executed notebook
├── chat_transcript.pdf                 # Log of prompts, custom instructions, and AI collaboration
├── fetal_health.csv                    # CTG dataset
└── README.md                           # Project documentation
