

import { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

const PolicyDetail = () => {
  let navigate = useNavigate();
  const { policyId } = useParams();
  const customer = JSON.parse(sessionStorage.getItem("active-customer"));
  const [policy, setPolicy] = useState({});

  useEffect(() => {
    const getPolicy = async () => {
      try {
        const response = await axios.get(`http://localhost:9000/api/policy/fetch?policyId=${policyId}`);
        if (response.data && response.data.policies?.length) {
          setPolicy(response.data.policies[0]);
        }
      } catch (err) {
        toast.error("Failed to fetch policy.");
      }
    };
    getPolicy();
  }, []);

  const loadRazorpay = (callback) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = callback;
    script.onerror = () => alert("Razorpay SDK failed to load.");
    document.body.appendChild(script);
  };

  const applyPolicy = () => {
    if (!customer) {
      alert("Please login as Customer");
      return;
    }

    // 1. Load Razorpay and then open payment window
    loadRazorpay(() => {
      const options = {
        
        key: "rzp_test_ysPKiyPVS6MyLj", // 🔁 Replace with actual key
        amount: policy.premiumAmount * 100, // in paise
        currency: "INR",
        name: "Health Insurance Payment",
        description: `Payment for ${policy.name}`,
        handler: function (response) {
          // 2. After payment success, call backend to register policy
          fetch("http://localhost:9000/api/policy/application/add", {
            method: "POST",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              customerId: customer.id,
              policyId: policy.id,
              razorpayPaymentId: response.razorpay_payment_id,
            }),
          })
            .then((result) => result.json())
            .then((res) => {
              if (res.success) {
                toast.success(res.responseMessage, {
                  position: "top-center",
                  autoClose: 1000,
                });
                setTimeout(() => navigate("/home"), 1500);
              } else {
                toast.error(res.responseMessage || "Application failed", {
                  position: "top-center",
                  autoClose: 1000,
                });
              }
            })
            .catch(() => {
              toast.error("Server error during application", {
                position: "top-center",
                autoClose: 1000,
              });
            });
        },
        prefill: {
          email: customer.emailId || "",
          contact: "9999999999", // optional, improve by adding customer mobile
        },
        theme: {
          color: "#3399cc",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    });
  };

  return (
    <div>
      <div className="mt-2 d-flex aligns-items-center justify-content-center">
        <div className="row">
          <div className="col">
            <div className="form-card" style={{ width: "25rem" }}>
              <div className="container-fluid">
                <div className="card-header bg-color custom-bg-text mt-2 d-flex justify-content-center align-items-center" style={{ borderRadius: "1em", height: "38px" }}>
                  <h4 className="card-title">Policy Details</h4>
                </div>
                <div className="card-body mt-3">
                  <h4 className="text-color">Policy Name: {policy.name}</h4>
                  <h4 className="text-color">Policy ID: {policy.policyId}</h4>
                  <h5 className="header-logo-color">Description: {policy.description}</h5>
                  <h5 className="header-logo-color">Plan: {policy.plan}</h5>
                  <h5 className="header-logo-color">Premium Amount: ₹{policy.premiumAmount}</h5>
                </div>
                <div className="card-footer mt-2 d-flex justify-content-center align-items-center">
                  <button onClick={applyPolicy} className="btn btn-lg bg-color custom-bg-text">
                    <b>Apply</b>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="col">
            <div className="form-card" style={{ width: "40rem" }}>
              <div className="container-fluid">
                <div className="card-header bg-color custom-bg-text mt-2 d-flex justify-content-center align-items-center" style={{ borderRadius: "1em", height: "38px" }}>
                  <h4 className="card-title">Coverage Details</h4>
                </div>
                <div className="card-body mt-3">
                  <div className="table-responsive">
                    <table className="table table-hover text-color text-center">
                      <thead className="table-bordered border-color bg-color custom-bg-text">
                        <tr>
                          <th scope="col">Policy Type</th>
                          <th scope="col">Policy Description</th>
                          <th scope="col">Coverage Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {policy.coverageDetailsList?.map((coverage, i) => (
                          <tr key={i}>
                            <td><b>{coverage.type}</b></td>
                            <td><b>{coverage.description}</b></td>
                            <td><b>{coverage.amount}</b></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
};

export default PolicyDetail;
