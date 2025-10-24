import pandas as pd
import numpy as np
# import matplotlib.pyplot as plt
import seaborn as sns
import streamlit as st
import altair as alt
import plotly.express as px
from scipy.stats import pearsonr
import plotly.graph_objects as go

# --- PAGE CONFIG ---
st.set_page_config(
    page_title="ReproSight: Analytics Hub",
    page_icon="📊",
    layout="wide",
    initial_sidebar_state="expanded",
)


df = pd.read_csv('final_cleaned.csv')


# --- A. Function to display the Landing Page (with new card design) ---
def show_landing_page():
    """Displays the main landing page content with visually appealing cards."""

# 1. CSS for the cards - WITH NEW STYLES FOR UNIFORM SIZE
    card_style = """
    <style>
    .card {
        background-color: #f0f2f6;
        border-radius: 10px;
        padding: 50px;
        margin: 10px 0;
        box-shadow: 0 4px 8px 0 rgba(0,0,0,0.2);
        transition: 0.3s;
        
        /* --- NEW LINES FOR UNIFORM SIZE --- */
        min-height: 350px; /* Sets a minimum height for all cards */
        display: flex; /* Enables flexbox layout */
        flex-direction: column; /* Stacks content vertically */
    }
    .card:hover {
        box-shadow: 0 8px 16px 0 rgba(0,0,0,0.2);
        transform: scale(1.02);
    }
    .card h3 {
        margin-top: 0;
        color: #0d3b66; /* A nice dark blue for headers */
    }

    .intro-card {
        background-color: #f0f2f6;
        border-radius: 10px;
        padding: 50px;
        margin: 10px 0;
        box-shadow: 0 4px 8px 0 rgba(0,0,0,0.2);
        transition: 0.3s;
    }
    .intro-card:hover {
        box-shadow: 0 8px 16px 0 rgba(0,0,0,0.2);
        transform: scale(1.02);
    }
    
    </style>
    """
    st.markdown(card_style, unsafe_allow_html=True)

    # --- Page Title ---
    st.write("# Welcome to ReproSight Analytics Hub!")
    # st.title("From Data to Discovery")

    st.markdown("""
    <div class="intro-card">
        <h4>What is ReproSight?</h4>
        <p> ReproSight is a clinical analytics platform designed to reveal the hidden relationships
        between environmental toxin exposure and human reproductive health.
        This dashboard brings data scientists and clinicians together to explore patterns,
        test hypotheses, and translate data into actionable insights. </p>
                
    </div>
    """,unsafe_allow_html=True)


    st.markdown("---")

    st.write("## 📊 Datasets powering ReproSight")
    # st.markdown("---")

    # --- Four horizontal dataset cards ---
    col1, col2, col3, col4 = st.columns(4)
    with col1:
        st.markdown("""
        <div class="card">
            <h4>Reproductive Hormone Dataset</h4>
            <p>Contains serum levels of testosterone, estradiol, and SHBG along with detection limit flags for hormonal assessment.</p>
        </div>
        """, unsafe_allow_html=True)
    with col2:
        st.markdown("""
        <div class="card">
            <h4>Environmental Metal Exposure Dataset</h4>
            <p>Includes blood concentrations of heavy metals such as lead, cadmium, mercury, selenium, and manganese.</p>
        </div>
        """, unsafe_allow_html=True)
    with col3:
        st.markdown("""
        <div class="card">
            <h4>Reproductive Health Questionnaire</h4>
            <p>Captures reproductive history including menstrual patterns, pregnancy attempts, menopause, hysterectomy, and hormone therapy.</p>
        </div>
        """, unsafe_allow_html=True)
    with col4:
        st.markdown("""
        <div class="card">
            <h4>Demographic and Socioeconomic Dataset</h4>
            <p>Provides demographic variables like age, gender, ethnicity, education, and income for contextual modeling.</p>
        </div>
        """, unsafe_allow_html=True)

    st.markdown("---")
    # with col1:
    #     # Card 1: Our Mission
    #     st.markdown(
    #         """
    #         <div class="card">
    #             <h3>🎯 Our Mission: What is ReproSight?</h3>
    #             <p>
    #             Our mission is to build a clinical decision-support tool that uncovers the hidden links between environmental toxins and reproductive health. We leverage machine learning to empower clinicians to better predict and manage risks like infertility and early menopause.
    #             </p>
    #         </div>
    #         """,
    #         unsafe_allow_html=True
    #     )

    #     # Card 2: The Data
    #     st.markdown(
    #         """
    #         <div class="card">
    #             <h3>📊 The Data: The NHANES Dataset</h3>
    #             <p>
    #             Our insights are built upon the <strong>National Health and Nutrition Examination Survey (NHANES)</strong> dataset. This comprehensive, real-world data provides a robust foundation for our analysis.
    #             </p>
    #         </div>
    #         """,
    #         unsafe_allow_html=True
    #     )

    # with col2:
    #     # Card 3: Why This Dashboard
    #     st.markdown(
    #         """
    #         <div class="card">
    #             <h3>🔎 Why a Dashboard?</h3>
    #             <p>
    #             This dashboard is our dual-purpose analytics hub. It serves as an <strong>internal sandbox</strong> for deep-dive exploration and as a <strong>presentation layer</strong> for stakeholders, bridging the gap between raw data and actionable intelligence.
    #             </p>
    #         </div>
    #         """,
    #         unsafe_allow_html=True
    #     )

    #     # Card 4: Next Steps
    #     st.markdown(
    #         """
    #         <div class="card">
    #             <h3>👉 Your Next Step: Choose Your Path</h3>
    #             <p>
    #             To begin, <strong>select your role from the sidebar on the left.</strong> Choose 'Stakeholder' for key findings or 'Data Scientist' for the full interactive toolkit.
    #             </p>
    #         </div>
    #         """,
    #         unsafe_allow_html=True
    #     )


# --- B. Function to display the Stakeholder Dashboard ---
def show_stakeholder_dashboard():
    """Displays the high-level, narrative-driven dashboard for stakeholders.
    """
    st.title("ReproSight: Key Insights")
    st.markdown("### Explore key findings across different aspects of reproductive health.")

# --- 4 TABS FOR MAIN DOMAINS ---
    tab1, tab2, tab3, tab4 = st.tabs([
        "Hormonal Patterns", 
        "Fertility Analysis", 
        "Menstrual Cycle Insights", 
        "Menopause Trends"
    ])

    with tab1:
        st.header("Analyzing Hormonal Patterns")

        # st.markdown("This heatmap shows the linear relationship between various heavy metals and key reproductive hormones. Bright red indicates a strong negative correlation, while bright blue indicates a strong positive correlation.")

        # Define the lists of columns for the heatmap
        hormone_cols = ['testosterone', 'estradiol', 'shbg']
        metal_cols = ['lead_µg/dL', 'cadmium_µg/L', 'mercury_µg/L', 'selenium_µg/L', 'manganese_µg/L']

        # Ensure all selected columns exist in the dataframe
        valid_hormone_cols = [col for col in hormone_cols if col in df.columns]
        valid_metal_cols = [col for col in metal_cols if col in df.columns]

        if not valid_hormone_cols or not valid_metal_cols:
            st.warning("Some hormone or metal columns were not found in the dataset.")
        else:
            # Calculate the full correlation matrix for the selected columns
            corr_matrix = df[valid_hormone_cols + valid_metal_cols].corr()

            # Isolate the part of the matrix that shows metals vs. hormones
            metal_hormone_corr = corr_matrix.loc[valid_hormone_cols, valid_metal_cols]

            # Create the heatmap
            fig_heatmap = px.imshow(
                metal_hormone_corr,
                text_auto=".2f",
                aspect="auto",
                title="Correlation Heatmap: Heavy Metals vs. Hormones",
                color_continuous_scale='RdBu_r', # Red-Blue diverging scale
                zmin=-1, zmax=1 # Set the color scale to be from -1 to 1
            )
            st.plotly_chart(fig_heatmap, use_container_width=True)

            st.markdown("This heatmap shows the linear relationship between various heavy metals and key reproductive hormones. Bright red indicates a strong negative correlation, while bright blue indicates a strong positive correlation.")
            # --- The Drill-Down Scatter Plot ---
        st.subheader("Metal vs. Hormone Impact Analysis")
        col1, col2 = st.columns(2)
        with col1:
            metal_to_plot = st.selectbox("Select a metal to plot:", options=valid_metal_cols, key="metal_scatter_select")
        with col2:
            hormone_to_plot = st.selectbox("Select a hormone to plot:", options=valid_hormone_cols, key="hormone_scatter_select")
        
        if metal_to_plot and hormone_to_plot:
            fig_scatter = px.scatter(
                df, 
                x=metal_to_plot, y=hormone_to_plot,
                trendline="ols",
                title=f"Relationship between {metal_to_plot} and {hormone_to_plot}",
                labels={
                    metal_to_plot: f"Blood {metal_to_plot.split('_')[0].capitalize()} Concentration",
                    hormone_to_plot: f"{hormone_to_plot.capitalize()} Level"
                },
                trendline_color_override="red"   # ← change trendline color here


            )
            st.plotly_chart(fig_scatter, use_container_width=True)


    # --- Tab 2: Fertility Analysis ---    
    with tab2:
        st.header("Infertility Insights")
        # st.markdown("""
        # This section explores how environmental heavy metal exposure, demographic variables, 
        # and biological factors influence infertility risk.
        # """)

        # --- Insight: Heavy Metal Exposure in Fertile vs. Infertile Groups ---
        st.subheader("How does heavy metal exposure differ between fertile and infertile groups?")
        
        # Create a copy with readable labels
        df['infertility_status'] = df['infertility_1yr'].map({1: 'Yes', 2: 'No'})

        metal_to_analyze = st.selectbox(
            "Select a heavy metal to compare:",
            options=['lead_µg/dL', 'cadmium_µg/L', 'mercury_µg/L', 'selenium_µg/L', 'manganese_µg/L'],
            key="fertility_metal_select"
        )

        if metal_to_analyze:
            fig_title = f"Distribution of {metal_to_analyze} for Fertile and Infertile Groups"
            fig = px.box(
                df,
                x='infertility_status',   # Use the new mapped column here
                y=metal_to_analyze,
                color='infertility_status',
                title=fig_title,
                labels={
                    "infertility_status": "Reported Infertility (1 Year+)",
                    metal_to_analyze: f"Blood {metal_to_analyze.split('_')[0].capitalize()} Concentration"
                },
                category_orders={"infertility_status": ["Yes", "No"]}
            )
            st.plotly_chart(fig, use_container_width=True)

            st.info(
                """
                **How to Interpret This Chart:**
                If the box for the “Infertile” group is noticeably higher than the “Fertile” group,
                it suggests a possible link between higher exposure to that metal and reported infertility.
                """
            )

            st.markdown("---")
            
            # --- Insight 2: Infertility Rate by Age Group (NEW) ---
            st.subheader("Infertility Rate by Age Group")
            df_fertility = df.copy()
            df_fertility['infertility_status'] = df_fertility['infertility_1yr'].map({1: 'Yes', 2: 'No'}).fillna('Unknown')
            # 1. Define age bins and labels for reproductive years
            bins = [18, 25, 30, 35, 40, 45, 50]
            labels = ['18-24', '25-29', '30-34', '35-39', '40-44', '45-50']
            
            # 2. Create age group column (filtering out ages > 50)
            df_age_analysis = df_fertility[(df_fertility['age_years'] >= 18) & (df_fertility['age_years'] < 50)].copy()
            df_age_analysis['age_group'] = pd.cut(df_age_analysis['age_years'], bins=bins, labels=labels, right=False)
            
            # 3. Create a boolean column for infertility
            df_age_analysis['is_infertile'] = (df_age_analysis['infertility_status'] == 'Yes')
            
            # 4. Calculate the mean infertility rate for each age group
            infertility_rate_by_age = df_age_analysis.groupby('age_group')['is_infertile'].mean().reset_index()
            infertility_rate_by_age['Infertility Rate (%)'] = infertility_rate_by_age['is_infertile'] * 100

            # 5. Create the bar chart
            if not infertility_rate_by_age.empty:
                fig_age = px.bar(
                    infertility_rate_by_age,
                    x='age_group',
                    y='Infertility Rate (%)',
                    title='Infertility Rate by Age Group',
                    labels={'age_group': 'Age Group', 'Infertility Rate (%)': 'Infertility Rate (%)'}
                )
                st.plotly_chart(fig_age, use_container_width=True)
                st.info(
                    """
                    **How to Interpret This Chart:**
                    This chart shows the percentage of women in each age group who reported experiencing infertility for at least one year.
                    """
                )
            else:
                st.warning("Not enough data in the 18-50 age range to display infertility rates by age group.")

    with tab3:
        st.header("Analysing Menstrual Cycle Patterns")
        # st.markdown("This section analyzes factors related to period regularity.")
        
        st.subheader("Comparing Heavy Metal Exposure for Regular vs. Irregular Cycles")
        
        # Let the user select a metal to analyze
        metal_menstrual = st.selectbox(
            "Select a heavy metal to compare:",
            options=['lead_µg/dL', 'cadmium_µg/L', 'mercury_µg/L', 'selenium_µg/L', 'manganese_µg/L'],
            key="menstrual_metal_select" # Use a unique key
        )
        if metal_menstrual:
            fig_rain = go.Figure()
            # Loop for Raincloud plot
            for status in df['regular_periods'].unique():
                df_filtered = df[df['regular_periods'] == status]
                fig_rain.add_trace(go.Violin(
                    x=df_filtered['regular_periods'], y=df_filtered[metal_menstrual], name=status,
                    box_visible=True, meanline_visible=True, points='all', jitter=0.3, pointpos=-1.8
                ))
            fig_rain.update_layout(title_text=f"Raincloud Plot: {metal_menstrual} for Regular vs. Irregular Cycles", xaxis_title="Regular Menstrual Periods", showlegend=False)
            st.plotly_chart(fig_rain, use_container_width=True)

        st.markdown("---")


        # --- Insight 2: Age of First Period vs. Metal Exposure (NEW BOX PLOT) ---
        st.subheader("How heavy Metal Exposure affects the Age of First Period")
        
        # Filter for realistic first period ages
        df_menarche = df[df['first_period_age'].between(8, 20)].copy()
        
        # Convert the age column to a string so Plotly treats it as a category, not a number
        df_menarche['first_period_age'] = df_menarche['first_period_age'].astype(str)

        metal_menarche = st.selectbox(
            "Select a heavy metal to investigate:",
            options=['lead_µg/dL', 'cadmium_µg/L', 'mercury_µg/L', 'selenium_µg/L', 'manganese_µg/L'],
            key="menarche_metal_select"
        )
        if metal_menarche:
            fig_menarche_box = px.box(
                df_menarche,
                y='first_period_age',  # X-axis is now the discrete age
                x=metal_menarche,      # Y-axis is the continuous metal level
                color='first_period_age', # Color by age for clarity
                title=f"Distribution of {metal_menarche} by Age of First Period",
                labels={
                    "first_period_age": "Age of First Period",
                    metal_menarche: f"Blood {metal_menarche.split('_')[0].capitalize()} Concentration"
                }
            )
            # Sort the x-axis to be in numerical order (e.g., 11, 12, 13)
            fig_menarche_box.update_xaxes(categoryorder='category ascending')
            st.plotly_chart(fig_menarche_box, use_container_width=True)
            st.info("This chart helps explore if metal exposure levels differ by the age of first menstruation. You can look for a trend (e.g., rising or falling) in the boxes as age increases.")
        # if metal_menstrual:
        #     fig = go.Figure()

        #     # For each category ('Yes', 'No'), we'll add a violin and a box plot
        #     for status in df['regular_periods'].unique():
        #         # Filter data for the specific category
        #         df_filtered = df[df['regular_periods'] == status]
                
        #         # Add the violin plot (the "cloud")
        #         fig.add_trace(go.Violin(
        #             x=df_filtered['regular_periods'],
        #             y=df_filtered[metal_menstrual],
        #             name=status,
        #             box_visible=True, # Add a box plot inside the violin
        #             meanline_visible=True, # Show the mean line
        #             points='all', # Show individual data points (the "rain")
        #             jitter=0.3,
        #             pointpos=-1.8
        #         ))
            
        #     fig.update_layout(
        #         title_text=f"Raincloud Plot: Distribution of {metal_menstrual} for Regular vs. Irregular Cycles",
        #         xaxis_title="Regular Menstrual Periods",
        #         showlegend=False # Hide legend as the x-axis already provides the labels
        #     )
        #     st.plotly_chart(fig, use_container_width=True)    

            


    with tab4:
        st.header("Menopause Trends")
        st.subheader("Investigating the Link Between Toxin Exposure and Menopause Age")
        
        # Filter the dataframe to only include rows with valid 'last_period_age' data
        df_menopause = df.dropna(subset=['last_period_age'])
        # 2. Then, filter out the unrealistic ages greater than 100
        df_menopause = df_menopause[df_menopause['last_period_age'] < 100]

        # Let the user select a metal to investigate
        metal_menopause = st.selectbox(
            "Select a heavy metal to investigate:",
            options=['lead_µg/dL', 'cadmium_µg/L', 'mercury_µg/L', 'selenium_µg/L', 'manganese_µg/L'],
            key="menopause_metal_select" # Use a unique key
        )

        if metal_menopause:
            fig = px.scatter(
                df_menopause, 
                x=metal_menopause, 
                y='last_period_age', 
                trendline="ols", # Ordinary Least Squares trendline
                title=f"Relationship between {metal_menopause} and Age of Last Period",
                labels={
                    "last_period_age": "Age of Last Menstrual Period",
                    metal_menopause: f"Blood {metal_menopause.split('_')[0].capitalize()} Concentration"
                },
                trendline_color_override="red"   # ← change trendline color here
            )
            st.plotly_chart(fig, use_container_width=True)
            st.info(
                """
                **How to Interpret This Chart:** A downward-sloping trendline could suggest an association between higher exposure to a metal and an earlier age of menopause.
                """
            )


# --- C. Function to display the Data Scientist Dashboard ---
def show_scientist_dashboard():
    """Displays the detailed, interactive dashboard for data scientists."""
    st.title("ReproSight: Modeler's Sandbox")

    st.markdown("### Interactive EDA Toolkit for Deep-Dive Analysis")


# --- THE TABBED INTERFACE ---
    tab1, tab2, tab3, tab4 = st.tabs([
        "Data Overview",
        "Univariate Explorer",
        "Bivariate Explorer",
        "Correlation Matrix"
    ])

    # --- Tab 1: Data Overview ---
    with tab1:
        # st.header("Dataset Quick Look")
        
        st.subheader("Shape and Size")
        rows, cols = df.shape
        col1, col2 = st.columns(2)
        col1.metric("Number of Rows", f"{rows:,}")
        col2.metric("Number of Columns", f"{cols}")
 

        # Raw dataset inspector
        st.subheader("Raw Data Inspector")
        st.dataframe(df)

        # st.subheader("Data Types")
        # st.dataframe(df.dtypes.to_frame().rename(columns={0: 'Data Type'}))

        st.subheader("Missing Values Heatmap")
        # A simple heatmap to show missing data patterns
        missing_data = df.isnull()
        fig_missing = px.imshow(missing_data, title="Heatmap of Missing Values",
                                labels=dict(color="Missing (True/False)"))
        st.plotly_chart(fig_missing, use_container_width=True)
        
        st.subheader("Summary Statistics (Numerical Columns)")
        st.dataframe(df.describe())


    # --- Tab 2, 3, 4: (The code for these tabs remains the same for now) ---
 
    with tab2:
        st.header("Univariate Explorer")
        # This selectbox will now be populated with your new columns
        column_to_inspect = st.selectbox("Select a column to inspect", df.columns)
        # The rest of the logic works as is!
        if df[column_to_inspect].dtype in ['int64', 'float64']:
            fig = px.histogram(df, x=column_to_inspect, nbins=40, title=f"Distribution of {column_to_inspect}")
        else:
            fig = px.bar(df[column_to_inspect].value_counts().reset_index(),
                 x='index', y=column_to_inspect,
                 title=f"Category Counts for {column_to_inspect}")
        st.plotly_chart(fig)

    with tab3:
        st.header("Bivariate Relationship Explorer")
        # # These selectboxes will also update automatically
        # x_var = st.selectbox("Select X-axis variable", df.columns, key="bivariate_x")
        # y_var = st.selectbox("Select Y-axis variable", df.columns, key="bivariate_y")
        numeric_cols = df.select_dtypes(include=np.number).columns.tolist()
        categorical_cols = df.select_dtypes(include=['category', 'object']).columns.tolist()

        metal_columns = ['lead_µg/dL', 'cadmium_µg/L', 'mercury_µg/L', 'selenium_µg/L', 'manganese_µg/L', 'lead_µmol/L', 'cadmium_nmol/L', 'mercury_nmol/L', 'selenium_µmol/L', 'manganese_nmol/L', 'Blood metal weights']
        non_metal_columns = [col for col in df.columns if col not in metal_columns]


        col1, col2, col3 = st.columns(3)
        with col1:
            x_var = st.selectbox("Select X-axis variable", options=df.columns, key="bivariate_x")
        with col2:
            y_var = st.selectbox("Select Y-axis variable", options=non_metal_columns, key="bivariate_y")
        with col3:
            color_var = st.selectbox("Select color variable (optional)", options=[None] + categorical_cols, key="bivariate_color")

        if x_var and y_var:
            if x_var in numeric_cols and y_var in numeric_cols:
                st.subheader(f"Scatter Plot: {x_var} vs. {y_var}")
                fig = px.scatter(df, x=x_var, y=y_var, color=color_var, title=f"{x_var} vs. {y_var}")
                st.plotly_chart(fig, use_container_width=True)

                # Create a temporary dataframe with only the two columns and drop rows where EITHER value is missing
                temp_df = df[[x_var, y_var]].dropna()
                
                # Check if there's enough data left to calculate correlation
                if len(temp_df) > 1:
                    corr, p_value = pearsonr(temp_df[x_var], temp_df[y_var])
                    st.info(f"**Pearson Correlation**: {corr:.3f}\n\n**P-value**: {p_value:.3g}")
                    st.write("A low p-value (e.g., < 0.05) suggests a statistically significant linear relationship.")
                else:
                    st.warning("Not enough overlapping data to calculate correlation.")
            
            # ... (rest of the plotting logic for box plots and heatmaps)
            elif (x_var in numeric_cols and y_var in categorical_cols) or \
                 (x_var in categorical_cols and y_var in numeric_cols):
                 # ... your box plot code
                 pass # Placeholder for brevity
            else:
                 # ... your heatmap code
                 pass # Placeholder for brevity

    with tab4:
        st.header("Correlation Matrix")
        # This will also work automatically by selecting only numeric columns
        # ...
        st.write("Visualize the linear relationships between all numerical variables.")

        numeric_df = df.select_dtypes(include=np.number)
        
        # 1. Calculate the correlation matrix and immediately round it
        corr_matrix = numeric_df.corr().round(2)

        corr_threshold = st.slider(
            "Filter by absolute correlation strength", 
            min_value=0.0, 
            max_value=1.0, 
            value=0.3,
            step=0.05
        )
        
        filtered_corr = corr_matrix[
            ((corr_matrix >= corr_threshold) | (corr_matrix <= -corr_threshold)) & (corr_matrix != 1.0)
        ]
        
        # 2. Plot the rounded and filtered matrix
        fig = px.imshow(
            filtered_corr, 
            text_auto=True,  # Now set to True, as the data is already rounded
            aspect="auto",
            title=f"Correlation Heatmap (Threshold > {corr_threshold:.2f})",
            color_continuous_scale='RdBu_r'
        )
        
        st.plotly_chart(fig, use_container_width=True)
        

# --- SIDEBAR ---
st.sidebar.title("Navigation")
# The user selects their role here
app_mode = st.sidebar.selectbox("What would you like to explore?",
    ["Select mode ...",  "Explore Dataset", "Key Insights"])

# --- MAIN PAGE ---
if app_mode == "Explore Dataset":
    show_scientist_dashboard()    # Build your interactive, technical dashboard here

elif app_mode == "Key Insights":
    show_stakeholder_dashboard()    # Build your clean, narrative-driven dashboard here

else:
    show_landing_page()

